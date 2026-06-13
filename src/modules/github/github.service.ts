import { PrismaClient } from '@prisma/client';
import { request } from 'undici';
import { AppError } from '../../utils/errors';

export class GithubService {
  constructor(private prisma: PrismaClient, private token?: string) {}

  async connect(userId: string, username: string) {
    const githubData = await this.fetchGithubData(username);

    // Store in DB
    const profile = await this.prisma.githubProfile.upsert({
      where: { userId },
      create: {
        userId,
        githubLogin: githubData.user.login,
        githubId: githubData.user.id,
        avatarUrl: githubData.user.avatar_url,
        htmlUrl: githubData.user.html_url,
        name: githubData.user.name,
        company: githubData.user.company,
        blog: githubData.user.blog,
        location: githubData.user.location,
        email: githubData.user.email,
        bio: githubData.user.bio,
        publicRepos: githubData.user.public_repos,
        followers: githubData.user.followers,
        following: githubData.user.following,
      },
      update: {
        githubLogin: githubData.user.login,
        githubId: githubData.user.id,
        avatarUrl: githubData.user.avatar_url,
        htmlUrl: githubData.user.html_url,
        name: githubData.user.name,
        company: githubData.user.company,
        blog: githubData.user.blog,
        location: githubData.user.location,
        email: githubData.user.email,
        bio: githubData.user.bio,
        publicRepos: githubData.user.public_repos,
        followers: githubData.user.followers,
        following: githubData.user.following,
      },
    });

    // Clear old repos and add new ones
    await this.prisma.repository.deleteMany({
      where: { githubProfileId: profile.id },
    });

    await this.prisma.repository.createMany({
      data: githubData.repos.map((repo: any) => ({
        githubProfileId: profile.id,
        githubRepoId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        htmlUrl: repo.html_url,
        description: repo.description,
        stargazersCount: repo.stargazers_count,
        language: repo.language,
        homepage: repo.homepage,
        updatedAt: repo.updated_at,
      })),
    });

    return githubData;
  }

  async getProfile(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const profile = await this.prisma.githubProfile.findUnique({
      where: { userId },
      include: {
        repositories: {
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!profile) {
      throw new AppError('GitHub profile not found for this user', 404);
    }

    const totalRepos = await this.prisma.repository.count({
      where: { githubProfileId: profile.id },
    });

    // Map back to the shape frontend expects
    const user = {
      login: profile.githubLogin,
      id: profile.githubId,
      avatar_url: profile.avatarUrl,
      html_url: profile.htmlUrl,
      name: profile.name,
      company: profile.company,
      blog: profile.blog,
      location: profile.location,
      email: profile.email,
      bio: profile.bio,
      public_repos: profile.publicRepos,
      followers: profile.followers,
      following: profile.following,
    };

    const repos = profile.repositories.map((repo) => ({
      id: repo.githubRepoId,
      name: repo.name,
      full_name: repo.fullName,
      html_url: repo.htmlUrl,
      description: repo.description,
      stargazers_count: repo.stargazersCount,
      language: repo.language,
      homepage: repo.homepage,
      updated_at: repo.updatedAt,
    }));

    return { 
      user, 
      repos,
      pagination: {
        totalItems: totalRepos,
        totalPages: Math.ceil(totalRepos / limit),
        currentPage: page,
        itemsPerPage: limit,
      }
    };
  }

  async disconnect(userId: string) {
    await this.prisma.githubProfile.delete({
      where: { userId },
    }).catch(() => {
      throw new AppError('No GitHub connection found', 404);
    });

    return { message: 'Disconnected successfully' };
  }

  async getProfileReadme(username: string): Promise<string | null> {
    try {
      // GitHub API to get specific repo readme
      // The profile README is always in a repo named after the user
      const { body, statusCode } = await this.makeRequest(
        `https://api.github.com/repos/${username}/${username}/readme`
      );

      if (statusCode === 404) return null;
      if (statusCode !== 200) {
        throw new AppError(`GitHub API error: ${statusCode}`, 502);
      }

      const data: any = await body.json();
      
      // The content is base64 encoded
      if (data.content && data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }

      return null;
    } catch (err) {
      // If repo or readme doesn't exist, return null gracefully
      return null;
    }
  }

  private async makeRequest(url: string, options: any = {}) {
    const headers: Record<string, string> = {
      'User-Agent': 'FLO-Backend',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    return request(url, { ...options, headers });
  }

  private async fetchGithubData(username: string) {
    // 1. Fetch User Profile
    const { body: userBody, statusCode: userStatus } = await this.makeRequest(
      `https://api.github.com/users/${username}`
    );

    if (userStatus !== 200) {
      throw new AppError(`GitHub API error: ${userStatus}`, 502);
    }

    const userData: any = await userBody.json();

    // 2. Fetch Repositories with pagination to ensure we get all
    let allRepos: any[] = [];
    let page = 1;

    while (true) {
      const { body: repoBody, statusCode: repoStatus } = await this.makeRequest(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=100&page=${page}`
      );

      if (repoStatus !== 200) {
        throw new AppError(`GitHub API error: ${repoStatus}`, 502);
      }

      const repoData: any = await repoBody.json();
      
      if (!Array.isArray(repoData) || repoData.length === 0) {
        break;
      }

      allRepos = allRepos.concat(repoData);

      if (repoData.length < 100) {
        break;
      }
      
      page++;
    }

    // Return all public repos without filtering out forks or repos without descriptions
    const filteredRepos = allRepos;

    return {
      user: userData,
      repos: filteredRepos,
    };
  }
}
