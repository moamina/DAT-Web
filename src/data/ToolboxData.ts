import { ToolboxItem } from '../types/ModelTypes';

export const toolboxCategories: Record<string, ToolboxItem[]> = {
  'Basic Elements': [
    { id: 'datanode', name: 'Data Node', type: 'DataNode', icon: '🗂️', color: '#6B7280', category: 'Basic Elements' }
  ],
  
  'Data Formats': [
    // Structured Data
    { id: 'relationaldb', name: 'Relational DB', type: 'RelationalDB', icon: '🏛️', color: '#4F46E5', category: 'Data Formats' },
    
    // Semi-Structured Data
    { id: 'xml', name: 'XML', type: 'XML', icon: '🏷️', color: '#059669', category: 'Data Formats' },
    { id: 'json', name: 'JSON', type: 'JSON', icon: '🧩', color: '#0891B2', category: 'Data Formats' },
    { id: 'csv', name: 'CSV', type: 'CSV', icon: '📑', color: '#7C2D12', category: 'Data Formats' },
    { id: 'excel', name: 'Excel', type: 'Excel', icon: '📈', color: '#166534', category: 'Data Formats' },
    { id: 'html', name: 'HTML', type: 'HTML', icon: '🌐', color: '#DC2626', category: 'Data Formats' },
    { id: 'rdf', name: 'RDF', type: 'RDF', icon: '🕸️', color: '#7C3AED', category: 'Data Formats' },
    { id: 'edi', name: 'EDI', type: 'EDI', icon: '🔄', color: '#B45309', category: 'Data Formats' },
    { id: 'sms', name: 'SMS', type: 'SMS', icon: '💬', color: '#BE185D', category: 'Data Formats' },
    { id: 'email', name: 'Email', type: 'Email', icon: '📧', color: '#059669', category: 'Data Formats' },
    
    // Unstructured Data - Multimedia
    { id: 'image', name: 'Image', type: 'Image', icon: '🖼️', color: '#7C3AED', category: 'Data Formats' },
    { id: 'video', name: 'Video', type: 'Video', icon: '🎬', color: '#BE185D', category: 'Data Formats' },
    { id: 'audio', name: 'Audio', type: 'Audio', icon: '🎙️', color: '#B45309', category: 'Data Formats' },
    
    // Unstructured Data - Office Files
    { id: 'pdf', name: 'PDF File', type: 'PDFFile', icon: '📕', color: '#DC2626', category: 'Data Formats' },
    { id: 'word', name: 'Word File', type: 'WordFile', icon: '📝', color: '#2563EB', category: 'Data Formats' },
    { id: 'textfile', name: 'Text File', type: 'TextFile', icon: '📄', color: '#6B7280', category: 'Data Formats' },
    { id: 'logs', name: 'Logs', type: 'Logs', icon: '📜', color: '#7C2D12', category: 'Data Formats' },
    
    // Sensor and GPS Data
    { id: 'sensordata', name: 'Sensor Data', type: 'SensorData', icon: '📡', color: '#059669', category: 'Data Formats' },
    { id: 'gpsdata', name: 'GPS Data', type: 'GPSData', icon: '📍', color: '#16A34A', category: 'Data Formats' }
  ],
  
  'Storage Types': [
    { id: 'filesystem', name: 'File System', type: 'File_System', icon: '🗄️', color: '#374151', category: 'Storage Types' },
    { id: 'relational', name: 'Relational', type: 'Relational', icon: '🏛️', color: '#1F2937', category: 'Storage Types' },
    { id: 'multidimensional', name: 'Multidimensional', type: 'Multidimensional', icon: '🧊', color: '#4338CA', category: 'Storage Types' },
    
    // NoSQL Types
    { id: 'documentdb', name: 'Document DB', type: 'DocumentOriented', icon: '📚', color: '#4338CA', category: 'Storage Types' },
    { id: 'columndb', name: 'Column DB', type: 'ColumnOriented', icon: '🗂️', color: '#7C3AED', category: 'Storage Types' },
    { id: 'graphdb', name: 'Graph DB', type: 'GraphsDatabase', icon: '🕸️', color: '#7C2D12', category: 'Storage Types' },
    { id: 'keyvalue', name: 'Key-Value', type: 'KeyValue', icon: '🔑', color: '#059669', category: 'Storage Types' }
  ],
  
  'Data Locations': [
    { id: 'cloud', name: 'Cloud', type: 'Cloud', icon: '☁️', color: '#0891B2', category: 'Data Locations' },
    { id: 'onpremise', name: 'On-Premise', type: 'On_Premise', icon: '🏢', color: '#374151', category: 'Data Locations' }
  ],
  
  'Processing Types': [
    { id: 'realtime', name: 'Real Time', type: 'RealTime', icon: '⚡', color: '#DC2626', category: 'Processing Types' },
    { id: 'batch', name: 'Batch', type: 'Batch', icon: '🗃️', color: '#7C3AED', category: 'Processing Types' }
  ],
  
  'Data Operations': [
    // Ingestion Operations
    { id: 'ingest', name: 'Ingest', type: 'Ingest', icon: '📥', color: '#16A34A', category: 'Data Operations' },
    { id: 'transform', name: 'Transform', type: 'Transform', icon: '🔄', color: '#B45309', category: 'Data Operations' },
    { id: 'compress', name: 'Compress', type: 'Compress', icon: '🗜️', color: '#7C2D12', category: 'Data Operations' },
    { id: 'integrate', name: 'Integrate', type: 'Integrate', icon: '🔗', color: '#4338CA', category: 'Data Operations' },
    { id: 'identify', name: 'Identify', type: 'Identify', icon: '🪪', color: '#059669', category: 'Data Operations' },
    { id: 'validate', name: 'Validate', type: 'Validate', icon: '✅', color: '#16A34A', category: 'Data Operations' },
    { id: 'filter', name: 'Filter', type: 'Filter', icon: '🔽', color: '#7C2D12', category: 'Data Operations' },
    { id: 'reducenoise', name: 'Reduce Noise', type: 'ReduceNoise', icon: '🔇', color: '#6B7280', category: 'Data Operations' },
    
    // Processing Operations
    { id: 'process', name: 'Process', type: 'Process', icon: '⚙️', color: '#2563EB', category: 'Data Operations' },
    { id: 'classify', name: 'Classify', type: 'Classify', icon: '🏷️', color: '#7C3AED', category: 'Data Operations' },
    { id: 'sort', name: 'Sort', type: 'Sort', icon: '↕️', color: '#059669', category: 'Data Operations' },
    { id: 'merge', name: 'Merge', type: 'Merge', icon: '🔀', color: '#B45309', category: 'Data Operations' },
    { id: 'aggregate', name: 'Aggregate', type: 'Aggregate', icon: '🧮', color: '#4338CA', category: 'Data Operations' },
    { id: 'cleaning', name: 'Cleaning', type: 'Cleaning', icon: '🧹', color: '#16A34A', category: 'Data Operations' },
    { id: 'mathop', name: 'Math Operation', type: 'Math_Operation', icon: '➕', color: '#7C2D12', category: 'Data Operations' },
    
    // Storage Operations
    { id: 'save', name: 'Save', type: 'Save', icon: '💾', color: '#4338CA', category: 'Data Operations' },
    { id: 'retrieve', name: 'Retrieve', type: 'Retrieve', icon: '📤', color: '#0891B2', category: 'Data Operations' },
    { id: 'archive', name: 'Archive', type: 'Archive', icon: '🗃️', color: '#6B7280', category: 'Data Operations' },
    { id: 'govern', name: 'Govern', type: 'Govern', icon: '⚖️', color: '#374151', category: 'Data Operations' },
    
    // Communication Operations
    { id: 'senddata', name: 'Send Data', type: 'SendData', icon: '📤', color: '#DC2626', category: 'Data Operations' },
    { id: 'generate', name: 'Generate', type: 'Generate', icon: '✨', color: '#7C3AED', category: 'Data Operations' },
    { id: 'verifydata', name: 'Verify Data', type: 'VerifyData', icon: '🛡️', color: '#059669', category: 'Data Operations' }
  ],
  
  'Analysis Operations': [
    { id: 'analyze', name: 'Analyze', type: 'Analyze', icon: '🔬', color: '#059669', category: 'Analysis Operations' },
    
    // Analysis Types
    { id: 'describe', name: 'Describe', type: 'Describe', icon: '📝', color: '#2563EB', category: 'Analysis Operations' },
    { id: 'diagnose', name: 'Diagnose', type: 'Diagnose', icon: '🩺', color: '#DC2626', category: 'Analysis Operations' },
    { id: 'predict', name: 'Predict', type: 'Predict', icon: '🔮', color: '#7C3AED', category: 'Analysis Operations' },
    { id: 'prescript', name: 'Prescriptive', type: 'Prescript', icon: '💊', color: '#059669', category: 'Analysis Operations' }
  ],
  
  'Consumption Operations': [
    { id: 'visualize', name: 'Visualize', type: 'Visualize', icon: '📊', color: '#BE185D', category: 'Consumption Operations' },
    { id: 'query', name: 'Query/Report', type: 'Query_Report', icon: '🔎', color: '#059669', category: 'Consumption Operations' },
    { id: 'api', name: 'API', type: 'API', icon: '🔌', color: '#7C3AED', category: 'Consumption Operations' }
  ],
  
  'Events': [
    { id: 'receivedata', name: 'Receive Data', type: 'ReceiveData', icon: '📨', color: '#16A34A', category: 'Events' },
  ]
};

export const getAllToolboxItems = (): ToolboxItem[] => {
  const items: ToolboxItem[] = [];
  
  Object.entries(toolboxCategories).forEach(([category, categoryItems]) => {
    categoryItems.forEach(item => {
      items.push({
        ...item,
        properties: getDefaultProperties(item.type)
      });
    });
  });
  
  return items;
};

function getDefaultProperties(type: string): Record<string, any> {
  switch (type) {
    case 'RelationalDB':
      return { dbName: 'Database' };
    case 'Image':
      return { numberColor: 256, transparency: false, animation: false };
    case 'SensorData':
      return { physicalsize: '10mm', measuringRange: '0-100', sensivity: 'High' };
    case 'VerifyData':
      return { 
        QualityMetrics: [], 
        availableMetrics: ['Completeness', 'Consistency', 'Validity', 'Accuracy', 'Timeliness', 'Uniqueness', 'Integrity'],
        desc: '' 
      };
    case 'SMS':
      return { from: '', to: '', message: '' };
    case 'Email':
      return { subject: '', from: '', to: '', message: '' };
    case 'GPSData':
      return { latitude: '', longitude: '', position: '', altitude: '', time: '' };
    case 'Audio':
    case 'Video':
      return { size: '', comment: '', length: '', format: '', url: '' };
    case 'OfficeFile':
    case 'PDFFile':
    case 'WordFile':
    case 'TextFile':
    case 'Logs':
      return { text: '', font: '', textsize: '12', color: '#000000', bold: false, italics: false, underline: false };
    default:
      return {};
  }
}