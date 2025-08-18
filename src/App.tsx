import React from 'react';
import { Download, Upload, Save, FileText } from 'lucide-react';
import Canvas from './components/Canvas';
import Toolbox from './components/Toolbox';
import PropertiesPanel from './components/PropertiesPanel';
import { useDataArchitecture } from './hooks/useDataArchitecture';
import { ToolboxItem } from './types/ModelTypes';

function App() {
  const {
    architecture,
    internalConnections,
    selectedElement,
    internalConnectingFrom,
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dragData = e.dataTransfer.getData('application/json');
      
      // Check if drag data is empty or invalid
      if (!dragData || dragData.trim() === '') {
        return; // Exit gracefully if no valid data
      }
      
      const item: ToolboxItem = JSON.parse(dragData);
      
      // Only create new nodes for "Data Node" type, ignore other elements
      if (item.type === 'DataNode') {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addDataNode(item, { x: Math.max(0, x - 100), y: Math.max(0, y - 75) });
      }
    } catch (error) {
      console.error('Failed to add node:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleExport = () => {
    const modelJson = exportModel();
    const blob = new Blob([modelJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${architecture.name}.json`;
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
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="text-blue-600" size={24} />
          <div>
            <h1 className="text-xl font-bold text-gray-800">Data Architecture Modeler</h1>
            <p className="text-sm text-gray-600">Design and visualize data flow architectures</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          
          <label className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            <Upload size={16} />
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
      <div className="flex-1 flex">
        {/* Toolbox */}
        <div className="flex-shrink-0">
          <Toolbox onDragStart={() => {}} />
        </div>

        {/* Canvas */}
        <div
          className="flex-1 relative"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
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
          onUpdateInternalConnection={() => {}} // Not needed for this feature
          onAddInternalConnection={addInternalConnection}
          onDeleteInternalConnection={deleteInternalConnection}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Statistics Grid */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">
                  Nodes: <span className="text-blue-600 font-semibold">{architecture.dataNodes.length}</span>
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">
                  Elements: <span className="text-purple-600 font-semibold">
                    {architecture.dataNodes.reduce((sum, node) => sum + node.behaviouralElements.length, 0)}
                  </span>
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">
                  Input Ports: <span className="text-green-600 font-semibold">
                    {architecture.dataNodes.reduce((sum, node) => 
                      sum + node.messagePorts.filter(p => p.type === 'input').length, 0
                    )}
                  </span>
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">
                  Output Ports: <span className="text-red-600 font-semibold">
                    {architecture.dataNodes.reduce((sum, node) => 
                      sum + node.messagePorts.filter(p => p.type === 'output').length, 0
                    )}
                  </span>
                </span>
              </div>
            </div>
            
            <div className="h-6 w-px bg-gray-300"></div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-indigo-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">
                  External: <span className="text-indigo-600 font-semibold">{architecture.connections.length}</span>
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">
                  Internal: <span className="text-orange-600 font-semibold">{internalConnections.length}</span>
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">
                  Verify Data: <span className="text-emerald-600 font-semibold">
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
            <div className="text-sm text-gray-500">
              {selectedElement ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>Selected: <span className="font-medium text-gray-700">{selectedElement}</span></span>
                </div>
              ) : (
                <span>No selection</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;