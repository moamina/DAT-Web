import React, { useState, useEffect } from 'react';
import { X, GitCommit, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { DataArchitecture, InternalConnection } from '../types/ModelTypes';
import { generateODCS } from '../utils/artifactGenerators';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  architecture: DataArchitecture;
  internalConnections: InternalConnection[];
}

const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  architecture,
  internalConnections
}) => {
  const [token, setToken] = useState<string>('');
  const [repo, setRepo] = useState<string>('');
  const [branch, setBranch] = useState<string>('main');
  const [filePath, setFilePath] = useState<string>('contracts/data_contract.odcs.yaml');
  const [commitMessage, setCommitMessage] = useState<string>(`feat: update ${architecture.name} data contract`);
  const [artifactType, setArtifactType] = useState<'odcs' | 'json'>('odcs');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  // Load saved credentials from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('dat_github_token');
    const savedRepo = localStorage.getItem('dat_github_repo');
    const savedBranch = localStorage.getItem('dat_github_branch');
    if (savedToken) setToken(savedToken);
    if (savedRepo) setRepo(savedRepo);
    if (savedBranch) setBranch(savedBranch);
  }, []);

  if (!isOpen) return null;

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessUrl(null);

    const cleanRepo = repo.trim().replace(/^https?:\/\/github\.com\//, '');
    if (!cleanRepo.includes('/')) {
      setError('Please provide repository in format: owner/repository (e.g. acme/data-platform)');
      return;
    }
    if (!token.trim()) {
      setError('Please provide a GitHub Personal Access Token (PAT) with repo scope');
      return;
    }

    setIsLoading(true);

    try {
      // Save credentials for next time
      localStorage.setItem('dat_github_token', token);
      localStorage.setItem('dat_github_repo', cleanRepo);
      localStorage.setItem('dat_github_branch', branch);

      // Determine content to commit
      const contentStr = artifactType === 'odcs'
        ? generateODCS(architecture, internalConnections)
        : JSON.stringify({ ...architecture, internalConnections }, null, 2);

      // UTF-8 to Base64
      const base64Content = btoa(unescape(encodeURIComponent(contentStr)));

      const apiUrl = `https://api.github.com/repos/${cleanRepo}/contents/${filePath}`;
      const headers = {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };

      // 1. Check if file exists to get existing SHA
      let existingSha: string | undefined = undefined;
      const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
      if (getRes.ok) {
        const fileData = await getRes.json();
        existingSha = fileData.sha;
      }

      // 2. Put file to GitHub
      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: commitMessage.trim() || `Update ${filePath}`,
          content: base64Content,
          branch: branch.trim() || 'main',
          sha: existingSha
        })
      });

      if (!putRes.ok) {
        const errorData = await putRes.json().catch(() => ({}));
        throw new Error(errorData.message || `GitHub API error (${putRes.status})`);
      }

      const resData = await putRes.json();
      const htmlUrl = resData.content?.html_url || `https://github.com/${cleanRepo}/blob/${branch}/${filePath}`;
      setSuccessUrl(htmlUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to sync with GitHub');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-sm">
              <GitCommit size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Direct GitHub Synchronization</h2>
              <p className="text-xs text-gray-500">Commit architecture contracts directly to repository</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSync} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successUrl && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2">
              <div className="flex items-center space-x-2 font-semibold text-emerald-900">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Successfully committed to GitHub!</span>
              </div>
              <a
                href={successUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-indigo-600 hover:text-indigo-800 font-medium underline"
              >
                <span>View file on GitHub</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              GitHub Personal Access Token (PAT)
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">Requires 'repo' permission to write files.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Repository (owner/repo)</label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="acme/data-platform"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target File Path</label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="contracts/pipeline.odcs.yaml"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Artifact Format</label>
              <select
                value={artifactType}
                onChange={(e: any) => setArtifactType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="odcs">ODCS Contract (.yaml)</option>
                <option value="json">Full Architecture (.json)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Commit Message</label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Committing...</span>
                </>
              ) : (
                <>
                  <GitCommit size={14} />
                  <span>Commit to GitHub</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GitHubSyncModal;
