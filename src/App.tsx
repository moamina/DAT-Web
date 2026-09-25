import React, { useState, useEffect } from 'react';
import { Download, Upload, FileText, Undo2, Redo2, Trash2, Sparkles, GitBranch, Wand2 } from 'lucide-react';
import Canvas from './components/Canvas';
import Toolbox from './components/Toolbox';
import PropertiesPanel from './components/PropertiesPanel';
import ArtifactsModal from './components/ArtifactsModal';
import GitHubSyncModal from './components/GitHubSyncModal';
import { useDataArchitecture } from './hooks/useDataArchitecture';

function App() {
  const {
    architecture,
    internalConnections,
    selectedElement,
    internalConnectingFrom,
    canUndo,
    canRedo,
    undo,
    redo,
    clearCanvas,
    applyAutoLayout,
    setSelectedElement,
    addDataNode,
    updateNode,
    addConnection,
    updateConnection,
    handleInternalPortClick,
    addBehaviouralElement,
    deleteElement,
    exportModel,
    importModel,
    addInternalConnection,
    deleteInternalConnection
  } = useDataArchitecture();

  const [isArtifactsOpen, setIsArtifactsOpen] = useState(false);
  const [isGitSyncOpen, setIsGitSyncOpen] = useState(false);

  // Global Keyboard Shortcuts for Undo & Redo
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [undo, redo]);

  const handleExport = () => {
    const modelJson = exportModel();
    const blob = new Blob([modelJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${architecture.name.replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        importModel(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800 leading-tight">Data Architecture Modeler</h1>
            <p className="text-xs text-gray-500">Design, verify, and synthesize data flow pipelines</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* History Controls */}
          <div className="flex items-center space-x-1 border-r border-gray-200 pr-2 mr-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-2 rounded-lg transition-colors text-sm ${
                canUndo ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-2 rounded-lg transition-colors text-sm ${
                canRedo ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={16} />
            </button>
            <button
              onClick={() => {
                if (architecture.dataNodes.length === 0) return;
                if (window.confirm("Clear all nodes and connections from the canvas?")) {
                  clearCanvas();
                }
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear Canvas"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Auto Layout Button */}
          <button
            onClick={applyAutoLayout}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 border border-gray-200 text-gray-700 rounded-lg hover:bg-slate-200 transition-colors text-xs font-semibold shadow-sm"
            title="Auto-Layout DAG (Rearrange nodes neatly into hierarchy)"
          >
            <Wand2 size={14} className="text-indigo-600" />
            <span>Auto Layout</span>
          </button>

          {/* Artifacts Generator Button */}
          <button
            onClick={() => setIsArtifactsOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all text-xs font-semibold shadow-sm hover:shadow"
            title="Generate ODCS Data Contracts, Airflow DAGs, dbt models, and specs"
          >
            <Sparkles size={14} />
            <span>Artifacts</span>
          </button>

          {/* Git Sync Button */}
          <button
            onClick={() => setIsGitSyncOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-xs font-semibold shadow-sm"
            title="Commit & Sync Data Contracts directly to GitHub"
          >
            <GitBranch size={14} />
            <span>Git Sync</span>
          </button>

          <div className="h-4 w-px bg-gray-200" />

          {/* Export & Import */}
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-slate-50 transition-colors text-xs font-medium shadow-sm"
          >
            <Download size={14} />
            <span>Export JSON</span>
          </button>
          
          <label className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer shadow-sm">
            <Upload size={14} />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbox */}
        <div className="flex-shrink-0 h-full border-r border-gray-200">
          <Toolbox onDragStart={() => {}} />
        </div>

        {/* Canvas */}
        <div className="flex-1 relative h-full">
          <Canvas
            dataNodes={architecture.dataNodes}
            connections={architecture.connections}
            internalConnections={internalConnections}
            internalConnectingFrom={internalConnectingFrom}
            selectedElement={selectedElement}
            onUpdateNode={updateNode}
            onUpdateConnection={updateConnection}
            onSelectElement={setSelectedElement}
            onDeleteElement={deleteElement}
            onAddBehaviouralElement={addBehaviouralElement}
            onConnectNodes={addConnection}
            onInternalPortClick={handleInternalPortClick}
            onDeleteInternalConnection={deleteInternalConnection}
            onAddDataNode={addDataNode}
            onAutoLayout={applyAutoLayout}
          />
        </div>

        {/* Properties Panel */}
        <PropertiesPanel
          selectedElement={selectedElement}
          dataNodes={architecture.dataNodes}
          connections={architecture.connections}
          internalConnections={internalConnections}
          onUpdateNode={updateNode}
          onUpdateConnection={updateConnection}
          onUpdateInternalConnection={() => {}}
          onAddInternalConnection={addInternalConnection}
          onDeleteInternalConnection={deleteInternalConnection}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex-shrink-0 z-10">
        <div className="flex items-center justify-between text-xs">
          {/* Statistics Grid */}
          <div className="flex items-center space-x-5">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded"></div>
                <span className="font-medium text-gray-700">
                  Nodes: <span className="text-blue-600 font-semibold">{architecture.dataNodes.length}</span>
                </span>
              </div>
              
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 bg-purple-500 rounded"></div>
                <span className="font-medium text-gray-700">
                  Elements: <span className="text-purple-600 font-semibold">
                    {architecture.dataNodes.reduce((sum, node) => sum + node.behaviouralElements.length, 0)}
                  </span>
                </span>
              </div>
              
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 bg-green-500 rounded"></div>
                <span className="font-medium text-gray-700">
                  Inputs: <span className="text-green-600 font-semibold">
                    {architecture.dataNodes.reduce((sum, node) => 
                      sum + node.messagePorts.filter(p => p.type === 'input').length, 0
                    )}
                  </span>
                </span>
              </div>
              
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 bg-red-500 rounded"></div>
                <span className="font-medium text-gray-700">
                  Outputs: <span className="text-red-600 font-semibold">
                    {architecture.dataNodes.reduce((sum, node) => 
                      sum + node.messagePorts.filter(p => p.type === 'output').length, 0
                    )}
                  </span>
                </span>
              </div>
            </div>
            
            <div className="h-4 w-px bg-gray-200"></div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded"></div>
                <span className="font-medium text-gray-700">
                  External Flows: <span className="text-indigo-600 font-semibold">{architecture.connections.length}</span>
                </span>
              </div>
              
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 bg-orange-500 rounded"></div>
                <span className="font-medium text-gray-700">
                  Internal Flows: <span className="text-orange-600 font-semibold">{internalConnections.length}</span>
                </span>
              </div>
              
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded"></div>
                <span className="font-medium text-gray-700">
                  Verifications: <span className="text-emerald-600 font-semibold">
                    {architecture.dataNodes.reduce((sum, node) => 
                      sum + node.behaviouralElements.filter(el => el.type === 'VerifyData').length, 0
                    )}
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Selection Status */}
          <div className="flex items-center space-x-3">
            <div className="text-gray-500">
              {selectedElement ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Selected: <span className="font-medium text-gray-700">{selectedElement}</span></span>
                </div>
              ) : (
                <span>No selection</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Artifacts Modal */}
      <ArtifactsModal
        isOpen={isArtifactsOpen}
        onClose={() => setIsArtifactsOpen(false)}
        architecture={architecture}
        internalConnections={internalConnections}
      />

      {/* GitHub Sync Modal */}
      <GitHubSyncModal
        isOpen={isGitSyncOpen}
        onClose={() => setIsGitSyncOpen(false)}
        architecture={architecture}
        internalConnections={internalConnections}
      />
    </div>
  );
}

export default App;