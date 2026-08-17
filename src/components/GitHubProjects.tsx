import { useState, useEffect } from 'react';

interface Repository {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  topics: string[];
}

interface Props {
  username: string;
  pinnedRepos?: string[];
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3776ab',
  Java: '#ed8b00',
  C: '#555555',
  'C++': '#00599c',
  PHP: '#777bb4',
  Vue: '#42b883',
  Kotlin: '#7F52FF',
  CSS: '#1572b6',
  HTML: '#e34c26',
  Ruby: '#CC342D',
  Go: '#00ADD8',
  Rust: '#dea584',
  FreeMarker: '#2c2c2c',
  EJS: '#a91e1e',
};

export default function GitHubProjects({ username, pinnedRepos = [] }: Props) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [languagesMap, setLanguagesMap] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pinned'>('all');

  useEffect(() => {
    async function fetchRepos() {
      try {
        const response = await fetch(
          `https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=public`
        );
        if (response.ok) {
          const data = await response.json();
          const nonForks = data.filter((repo: any) => !repo.fork && repo.name !== username);
          setRepos(nonForks);

          const toFetch = nonForks.slice(0, 12);
          const results = await Promise.allSettled(
            toFetch.map((repo: any) =>
              fetch(`https://api.github.com/repos/${username}/${repo.name}/languages`)
                .then((res) => (res.ok ? res.json() : {}))
            )
          );
          const map: Record<string, Record<string, number>> = {};
          results.forEach((result, index) => {
            if (result.status === 'fulfilled' && Object.keys(result.value).length > 0) {
              map[toFetch[index].name] = result.value;
            }
          });
          setLanguagesMap(map);
        }
      } catch (error) {
        console.error('Failed to fetch repos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRepos();
  }, [username]);

  const getFilteredRepos = () => {
    if (filter === 'pinned') {
      if (pinnedRepos.length === 0) return [];
      return repos.filter(repo => pinnedRepos.includes(repo.name));
    }
    return repos.slice(0, 12);
  };

  const getLanguageColor = (lang: string | null) => {
    return LANGUAGE_COLORS[lang || ''] || '#6e7681';
  };

  const getRepoLanguages = (repoName: string): [string, number][] => {
    const langs = languagesMap[repoName];
    if (!langs) return [];
    return Object.entries(langs)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  };

  const formatRepoName = (name: string) => {
    return name
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading projects...</p>
        <style>{loadingStyles}</style>
      </div>
    );
  }

  const filteredRepos = getFilteredRepos();

  return (
    <div className="github-section">
      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'pinned' ? 'active' : ''}`}
          onClick={() => setFilter('pinned')}
        >
          Pinned
          {pinnedRepos.length > 0 && (
            <span className="pinned-count">{pinnedRepos.length}</span>
          )}
        </button>
      </div>

      {filteredRepos.length === 0 && filter === 'pinned' ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </div>
          <h3>No repositories configured</h3>
          <p>Edit <code>src/pages/index.astro</code> and add your favorite repos in <code>pinnedRepos</code></p>
          <div className="empty-example">
            <code>&lt;GitHubProjects pinnedRepos=&#123;['repo1', 'repo2', 'repo3']&#125; /&gt;</code>
          </div>
        </div>
      ) : (
        <div className="repos-grid">
          {filteredRepos.map((repo) => (
            <a
              key={repo.name}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`repo-card ${filter === 'pinned' ? 'pinned-card' : ''}`}
            >
              <div className="repo-header">
                <svg className="repo-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span className="repo-name">{formatRepoName(repo.name)}</span>
                {filter === 'pinned' && (
                  <span className="pinned-badge">Pinned</span>
                )}
              </div>
              
              <p className="repo-description">
                {repo.description || 'No description available'}
              </p>

              <div className="repo-meta">
                {(() => {
                  const langs = getRepoLanguages(repo.name);
                  if (langs.length > 0) {
                    return langs.map(([lang]) => (
                      <span key={lang} className="repo-language">
                        <span
                          className="language-dot"
                          style={{ backgroundColor: getLanguageColor(lang) }}
                        />
                        {lang}
                      </span>
                    ));
                  }
                  return repo.language && (
                    <span className="repo-language">
                      <span
                        className="language-dot"
                        style={{ backgroundColor: getLanguageColor(repo.language) }}
                      />
                      {repo.language}
                    </span>
                  );
                })()}
                {repo.stargazers_count > 0 && (
                  <span className="repo-stars">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                    {repo.stargazers_count}
                  </span>
                )}
              </div>

              {repo.topics.length > 0 && (
                <div className="repo-topics">
                  {repo.topics.map((topic) => (
                    <span key={topic} className="topic-tag">{topic}</span>
                  ))}
                </div>
              )}

              <div className="repo-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </a>
          ))}
        </div>
      )}

      <a
        href={`https://github.com/${username}?tab=repositories`}
        target="_blank"
        rel="noopener noreferrer"
        className="view-all-link"
      >
        View all projects on GitHub
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .github-section {
    margin-top: 2rem;
  }

  .filter-bar {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.25rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .filter-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .filter-btn.active {
    background: var(--accent);
    color: var(--bg-primary);
    border-color: var(--accent);
  }

  .pinned-count {
    background: var(--bg-primary);
    color: var(--accent);
    padding: 0.1rem 0.4rem;
    border-radius: 10px;
    font-size: 0.75rem;
  }

  .filter-btn.active .pinned-count {
    background: rgba(0, 0, 0, 0.2);
    color: var(--bg-primary);
  }

  .repos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1.5rem;
  }

  .repo-card {
    position: relative;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    text-decoration: none;
  }

  .repo-card:hover {
    border-color: var(--accent);
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }

  .repo-card.pinned-card {
    border-color: var(--accent);
    background: linear-gradient(135deg, var(--bg-secondary) 0%, rgba(0, 255, 136, 0.05) 100%);
  }

  .repo-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .repo-icon {
    color: var(--text-muted);
  }

  .repo-name {
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    flex: 1;
  }

  .pinned-badge {
    padding: 0.25rem 0.5rem;
    background: var(--accent);
    color: var(--bg-primary);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 600;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .repo-description {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.6;
    flex: 1;
  }

  .repo-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .repo-language {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .language-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .repo-stars {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #fbbf24;
  }

  .repo-topics {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.25rem;
  }

  .topic-tag {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--accent);
    background: var(--accent-glow);
    border: 1px solid rgba(0, 255, 136, 0.2);
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
  }

  .repo-arrow {
    position: absolute;
    bottom: 1.5rem;
    right: 1.5rem;
    color: var(--text-muted);
    opacity: 0;
    transition: all 0.2s ease;
  }

  .repo-card:hover .repo-arrow {
    opacity: 1;
    color: var(--accent);
    transform: translateX(4px);
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    background: var(--bg-secondary);
    border: 1px dashed var(--border);
    border-radius: 12px;
  }

  .empty-icon {
    color: var(--text-muted);
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    color: var(--text-primary);
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
  }

  .empty-state p {
    color: var(--text-muted);
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .empty-state code {
    background: var(--bg-tertiary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    color: var(--accent);
  }

  .empty-example {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 1rem;
  }

  .view-all-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 2rem;
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }

  .view-all-link:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-glow);
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    gap: 1rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .repos-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const loadingStyles = `
  .loading-container p {
    font-family: var(--font-mono);
    color: var(--text-muted);
    font-size: 0.9rem;
  }
`;