import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, Code2, Layers, Database, Image, Workflow, CheckSquare } from 'lucide-react';
import { DataArchitecture, InternalConnection } from '../types/ModelTypes';
import {
  generateODCS,
  generateMermaid,
  generateDbtArtifacts,
  generateArchitectureReport,
  generateCanvasSvg,
  generateAirflowDag,
  generateGreatExpectationsSuite
} from '../utils/artifactGenerators';

interface ArtifactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  architecture: DataArchitecture;
  internalConnections: InternalConnection[];
}

type ArtifactTab = 'odcs' | 'mermaid' | 'dbt' | 'airflow' | 'expectations' | 'report' | 'svg';

const ArtifactsModal: React.FC<ArtifactsModalProps> = ({
  isOpen,
  onClose,
  architecture,
  internalConnections
}) => {
  const [activeTab, setActiveTab] = useState<ArtifactTab>('odcs');
  const [dbtSubTab, setDbtSubTab] = useState<'sources' | 'models' | 'schema'>('sources');
  const [selectedDbtModel, setSelectedDbtModel] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate artifacts dynamically
  const odcsContent = generateODCS(architecture, internalConnections);
  const mermaidContent = generateMermaid(architecture, internalConnections);
  const dbtArtifacts = generateDbtArtifacts(architecture);
  const airflowContent = generateAirflowDag(architecture);
  const expectationsContent = generateGreatExpectationsSuite(architecture);
  const reportContent = generateArchitectureReport(architecture, internalConnections);
  const svgContent = generateCanvasSvg(architecture);

  // Set default dbt model if not selected
  const dbtModelKeys = Object.keys(dbtArtifacts.modelsSql);
  const activeDbtModelKey = selectedDbtModel && dbtArtifacts.modelsSql[selectedDbtModel]
    ? selectedDbtModel
    : dbtModelKeys[0] || '';

  // Get active text and download filename
  let currentContent = '';
  let filename = '';
  let mimeType = 'text/plain';

  switch (activeTab) {
    case 'odcs':
      currentContent = odcsContent;
      filename = `${architecture.name.toLowerCase().replace(/\s+/g, '_')}_contract.odcs.yaml`;
      mimeType = 'text/yaml';
      break;
    case 'mermaid':
      currentContent = mermaidContent;
      filename = `${architecture.name.toLowerCase().replace(/\s+/g, '_')}_diagram.mmd`;
      mimeType = 'text/markdown';
      break;
    case 'dbt':
      if (dbtSubTab === 'sources') {
        currentContent = dbtArtifacts.sourcesYml;
        filename = 'sources.yml';
      } else if (dbtSubTab === 'schema') {
        currentContent = dbtArtifacts.schemaYml;
        filename = 'schema.yml';
      } else {
        currentContent = dbtArtifacts.modelsSql[activeDbtModelKey] || '-- No models generated';
        filename = activeDbtModelKey || 'model.sql';
      }
      mimeType = filename.endsWith('.yml') ? 'text/yaml' : 'text/x-sql';
      break;
    case 'airflow':
      currentContent = airflowContent;
      filename = `${architecture.name.toLowerCase().replace(/\s+/g, '_')}_dag.py`;
      mimeType = 'text/x-python';
      break;
    case 'expectations':
      currentContent = expectationsContent;
      filename = `${architecture.name.toLowerCase().replace(/\s+/g, '_')}_suite.json`;
      mimeType = 'application/json';
      break;
    case 'report':
      currentContent = reportContent;
      filename = `${architecture.name.toLowerCase().replace(/\s+/g, '_')}_spec.md`;
      mimeType = 'text/markdown';
      break;
    case 'svg':
      currentContent = svgContent;
      filename = `${architecture.name.toLowerCase().replace(/\s+/g, '_')}.svg`;
      mimeType = 'image/svg+xml';
      break;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Architecture Artifacts Generator</h2>
              <p className="text-xs text-gray-500">
                Synthesize industry-standard Data Contracts, Airflow DAGs, dbt tests, and specs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top-Level Tabs */}
        <div className="flex items-center px-6 border-b border-gray-200 bg-white space-x-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('odcs')}
            className={`py-3 px-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'odcs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText size={15} />
            <span>ODCS Contract</span>
          </button>

          <button
            onClick={() => setActiveTab('mermaid')}
            className={`py-3 px-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'mermaid'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Code2 size={15} />
            <span>Mermaid.js</span>
          </button>

          <button
            onClick={() => setActiveTab('dbt')}
            className={`py-3 px-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'dbt'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Database size={15} />
            <span>dbt Models & Tests</span>
          </button>

          <button
            onClick={() => setActiveTab('airflow')}
            className={`py-3 px-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'airflow'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Workflow size={15} />
            <span>Airflow DAG</span>
          </button>

          <button
            onClick={() => setActiveTab('expectations')}
            className={`py-3 px-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'expectations'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <CheckSquare size={15} />
            <span>Great Expectations</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`py-3 px-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'report'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers size={15} />
            <span>Architecture Spec</span>
          </button>

          <button
            onClick={() => setActiveTab('svg')}
            className={`py-3 px-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'svg'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Image size={15} />
            <span>Vector SVG</span>
          </button>
        </div>

        {/* Sub-bar for dbt options if active */}
        {activeTab === 'dbt' && (
          <div className="px-6 py-2 bg-slate-100 border-b border-gray-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDbtSubTab('sources')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  dbtSubTab === 'sources' ? 'bg-white shadow-sm text-indigo-600 font-semibold' : 'text-gray-600 hover:bg-slate-200'
                }`}
              >
                sources.yml
              </button>
              <button
                onClick={() => setDbtSubTab('models')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  dbtSubTab === 'models' ? 'bg-white shadow-sm text-indigo-600 font-semibold' : 'text-gray-600 hover:bg-slate-200'
                }`}
              >
                models/*.sql ({dbtModelKeys.length})
              </button>
              <button
                onClick={() => setDbtSubTab('schema')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  dbtSubTab === 'schema' ? 'bg-white shadow-sm text-indigo-600 font-semibold' : 'text-gray-600 hover:bg-slate-200'
                }`}
              >
                schema.yml (Quality Tests)
              </button>
            </div>

            {dbtSubTab === 'models' && dbtModelKeys.length > 0 && (
              <select
                value={activeDbtModelKey}
                onChange={(e) => setSelectedDbtModel(e.target.value)}
                className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {dbtModelKeys.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden p-6 bg-slate-900 text-slate-100 relative">
          {activeTab === 'svg' ? (
            <div className="flex-1 flex flex-col h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Vector Visual Render Preview</span>
                <span>Ready for Illustrator, Figma, or Web Embedding</span>
              </div>
              <div className="flex-1 flex items-center justify-center p-6 overflow-auto bg-slate-900">
                <div
                  className="bg-white p-4 rounded-xl shadow-lg max-w-full max-h-full overflow-auto"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 h-full overflow-auto font-mono text-xs leading-relaxed bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-inner select-text">
              <pre className="whitespace-pre">{currentContent}</pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-500 flex items-center space-x-2">
            <span className="font-semibold text-gray-700">{filename}</span>
            <span>•</span>
            <span>{currentContent.split('\n').length} lines</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs font-semibold shadow-sm"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-semibold shadow-sm"
            >
              <Download size={14} />
              <span>Download {filename.split('.').pop()?.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtifactsModal;
