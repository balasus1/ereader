'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ReactReader } from 'react-reader';
import { FiSettings, FiBookmark, FiList, FiX, FiTrash2, FiCheck, FiTag, FiHome } from 'react-icons/fi';
import '../../styles/reader.css';

const HIGHLIGHT_COLORS = [
  { name: 'yellow', value: '#ffeb3b' },
  { name: 'green', value: '#a5d6a7' },
  { name: 'blue', value: '#90caf9' },
  { name: 'pink', value: '#f48fb1' }
];

const fontFamilies = {
  'Helvetica': 'Helvetica, Arial, sans-serif',
  'Georgia': 'Georgia, serif',
  'Times New Roman': 'Times New Roman, serif',
  'Verdana': 'Verdana, sans-serif'
};

const customStyles = {
  container: {
    height: '100%',
    width: '100%',
    position: 'relative',
    overflow: 'hidden'
  },
  readerArea: {
    position: 'relative',
    height: 'calc(100% - 48px)',
    width: '100%',
    overflow: 'hidden',
    background: 'var(--reader-bg-color, #fff)',
    color: 'var(--reader-text-color, #000)'
  }
};

const themes = {
  light: {
    style: {
      body: {
        background: '#ffffff',
        color: '#000000'
      }
    },
    vars: {
      '--reader-bg-color': '#ffffff',
      '--reader-text-color': '#000000'
    }
  },
  sepia: {
    style: {
      body: {
        background: '#f4ecd8',
        color: '#5b4636'
      }
    },
    vars: {
      '--reader-bg-color': '#f4ecd8',
      '--reader-text-color': '#5b4636'
    }
  },
  dark: {
    style: {
      body: {
        background: '#2b2b2b',
        color: '#dddddd'
      }
    },
    vars: {
      '--reader-bg-color': '#2b2b2b',
      '--reader-text-color': '#dddddd'
    }
  }
};

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [fontSize, setFontSize] = useState('16px');
  const [fontFamily, setFontFamily] = useState('Helvetica');
  const [bookmarks, setBookmarks] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [selections, setSelections] = useState([]);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState({ x: 0, y: 0 });
  const [currentSelection, setCurrentSelection] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [annotationComment, setAnnotationComment] = useState('');
  const [annotationTags, setAnnotationTags] = useState('');
  const [showAnnotationMenu, setShowAnnotationMenu] = useState(false);
  const renditionRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    // Load saved preferences
    const loadPreferences = () => {
      const savedLocation = localStorage.getItem(`location_${params.bookId}`);
      const savedTheme = localStorage.getItem(`theme_${params.bookId}`);
      const savedFontSize = localStorage.getItem(`fontSize_${params.bookId}`);
      const savedFontFamily = localStorage.getItem(`fontFamily_${params.bookId}`);
      const savedBookmarks = localStorage.getItem(`bookmarks_${params.bookId}`);
      const savedSelections = localStorage.getItem(`highlights_${params.bookId}`);
      const savedAnnotations = localStorage.getItem(`annotations_${params.bookId}`);

      if (savedLocation) setLocation(savedLocation);
      if (savedTheme) setCurrentTheme(savedTheme);
      if (savedFontSize) setFontSize(savedFontSize);
      if (savedFontFamily) setFontFamily(savedFontFamily);
      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
      if (savedSelections) setSelections(JSON.parse(savedSelections));
      if (savedAnnotations) setAnnotations(JSON.parse(savedAnnotations));
    };

    loadPreferences();

    // Handle clicks outside settings panel
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
        setShowBookmarks(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [params.bookId]);

  useEffect(() => {
    if (renditionRef.current) {
      // Apply theme
      renditionRef.current.themes.register(themes);
      renditionRef.current.themes.select(currentTheme);
      
      // Apply font size
      renditionRef.current.themes.fontSize(fontSize);
      
      // Apply font family
      renditionRef.current.themes.font(fontFamilies[fontFamily]);

      // Apply theme variables
      Object.entries(themes[currentTheme].vars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });

      localStorage.setItem(`theme_${params.bookId}`, currentTheme);
      localStorage.setItem(`fontSize_${params.bookId}`, fontSize);
      localStorage.setItem(`fontFamily_${params.bookId}`, fontFamily);
    }
  }, [currentTheme, fontSize, fontFamily, params.bookId]);

  const handleLocationChanged = (epubcifi) => {
    setLocation(epubcifi);
    localStorage.setItem(`location_${params.bookId}`, epubcifi);
  };

  const toggleBookmark = () => {
    if (!location) return;
    const newBookmarks = bookmarks.includes(location)
      ? bookmarks.filter(b => b !== location)
      : [...bookmarks, location];
    setBookmarks(newBookmarks);
    localStorage.setItem(`bookmarks_${params.bookId}`, JSON.stringify(newBookmarks));
  };

  const deleteBookmark = (bookmarkToDelete) => {
    const newBookmarks = bookmarks.filter(bookmark => bookmark !== bookmarkToDelete);
    setBookmarks(newBookmarks);
    localStorage.setItem(`bookmarks_${params.bookId}`, JSON.stringify(newBookmarks));
  };

  const onRenditionReady = (rendition) => {
    renditionRef.current = rendition;
    
    // Configure iframe when it's ready
    rendition.hooks.content.register((contents) => {
      // Set sandbox permissions for the iframe
      const doc = contents.document;
      const iframe = doc.defaultView.frameElement;
      if (iframe) {
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms');
      }

      // Add custom styles for highlights
      const style = doc.createElement('style');
      style.innerHTML = `
        .highlight-yellow { background-color: rgba(255, 235, 59, 0.3); }
        .highlight-green { background-color: rgba(165, 214, 167, 0.3); }
        .highlight-blue { background-color: rgba(144, 202, 249, 0.3); }
        .highlight-pink { background-color: rgba(244, 143, 177, 0.3); }
      `;
      doc.head.appendChild(style);
    });
    
    // Handle text selection
    rendition.on('selected', (cfiRange, contents) => {
      // Ensure we're working with the correct document context
      const doc = contents.document || contents.documentElement?.ownerDocument;
      if (!doc) {
        console.warn('Document context not found');
        return;
      }

      const selection = doc.getSelection();
      if (!selection || !selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Get the viewer container with a more specific selector and error handling
      const viewerContainer = document.querySelector('.epub-container');
      if (!viewerContainer) {
        console.warn('Viewer container not found');
        return;
      }
      
      const viewerRect = viewerContainer.getBoundingClientRect();
      
      // Calculate position relative to the viewer
      const x = Math.min(
        Math.max(rect.left + (rect.width / 2), viewerRect.left + 120),
        viewerRect.right - 120
      );
      const y = Math.max(rect.top - 40, viewerRect.top + 10);
      
      // Calculate adjusted position
      const adjustedY = y - (viewerRect.top * 0.25); // More precise control over vertical position
      
      // Check if there's an existing annotation for this selection
      const existingAnnotation = annotations.find(ann => ann.cfiRange === cfiRange);
      
      if (existingAnnotation) {
        // If there's an existing annotation, load it
        setCurrentAnnotation(existingAnnotation);
        setAnnotationComment(existingAnnotation.comment || '');
        setAnnotationTags(existingAnnotation.tags?.join(', ') || '');
        setShowAnnotationMenu(true);
        setShowHighlightMenu(false);
      } else {
        // If it's a new selection, show the highlight menu
        setCurrentSelection({
          cfiRange,
          text: selection.toString(),
          range
        });

        setHighlightPosition({
          x: x - viewerRect.left,
          y: adjustedY
        });

        setShowHighlightMenu(true);
        setShowAnnotationMenu(false);
      }
    });

    // Apply existing highlights
    selections.forEach(({ cfiRange, color }) => {
      const colorName = HIGHLIGHT_COLORS.find(c => c.value === color)?.name || 'yellow';
      rendition.annotations.add('highlight', cfiRange, {}, null, 'hl', {
        className: `highlight-${colorName}`
      });
    });
  };

  const handleHighlight = (color) => {
    if (!currentSelection) return;

    setShowHighlightMenu(false);
    
    // Position annotation menu relative to the highlight menu
    const viewerContainer = document.querySelector('.epub-container');
    if (!viewerContainer) {
      console.warn('Viewer container not found');
      return;
    }
    
    const viewerRect = viewerContainer.getBoundingClientRect();
    
    setHighlightPosition(prev => ({
      x: prev.x,
      y: prev.y + 50 // Removed viewerRect.top to avoid double-offsetting
    }));
    
    setShowAnnotationMenu(true);
    setCurrentAnnotation({
      cfiRange: currentSelection.cfiRange,
      text: currentSelection.text,
      color: color,
      comment: '',
      tags: []
    });
  };

  const handleSaveAnnotation = () => {
    if (!currentAnnotation) return;

    const newAnnotation = {
      ...currentAnnotation,
      comment: annotationComment,
      tags: annotationTags.split(',').map(tag => tag.trim()).filter(Boolean),
      timestamp: new Date().toISOString()
    };

    // Update selections and annotations
    const newSelections = [...selections, newAnnotation];
    const newAnnotations = [...annotations, newAnnotation];

    setSelections(newSelections);
    setAnnotations(newAnnotations);

    // Save to localStorage
    localStorage.setItem(`selections_${params.bookId}`, JSON.stringify(newSelections));
    localStorage.setItem(`annotations_${params.bookId}`, JSON.stringify(newAnnotations));

    // Add highlight
    renditionRef.current.annotations.add(
      'highlight',
      currentAnnotation.cfiRange,
      {},
      null,
      'hl',
      {
        className: `highlight-${HIGHLIGHT_COLORS.find(c => c.value === currentAnnotation.color)?.name || 'yellow'}`
      }
    );

    setShowAnnotationMenu(false);
    setCurrentAnnotation(null);
    setAnnotationComment('');
    setAnnotationTags('');
  };

  const handleUpdateAnnotation = () => {
    if (!currentAnnotation) return;

    const updatedAnnotation = {
      ...currentAnnotation,
      comment: annotationComment,
      tags: annotationTags.split(',').map(tag => tag.trim()).filter(Boolean),
      lastModified: new Date().toISOString()
    };

    // Update annotations array
    const newAnnotations = annotations.map(ann => 
      ann.cfiRange === currentAnnotation.cfiRange ? updatedAnnotation : ann
    );

    setAnnotations(newAnnotations);
    localStorage.setItem(`annotations_${params.bookId}`, JSON.stringify(newAnnotations));

    setShowAnnotationMenu(false);
    setCurrentAnnotation(null);
    setAnnotationComment('');
    setAnnotationTags('');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow-sm h-12">
        <div className="flex gap-4">
          <button
            onClick={() => setShowTOC(!showTOC)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Table of Contents"
          >
            <FiList className="w-5 h-5" />
          </button>
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Back to Library"
          >
            <FiHome className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Settings"
          >
            <FiSettings className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              toggleBookmark();
              setShowBookmarks(true);
            }}
            className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${
              bookmarks.includes(location) ? 'text-blue-500' : ''
            }`}
            title="Bookmark"
          >
            <FiBookmark className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div
          ref={settingsRef}
          className="absolute right-4 top-16 bg-white shadow-xl p-6 rounded-lg z-50 w-72"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Theme</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(themes).map(theme => (
                  <button
                    key={theme}
                    onClick={() => setCurrentTheme(theme)}
                    className={`px-3 py-2 rounded ${
                      currentTheme === theme
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Font Size</h4>
              <input
                type="range"
                min="12"
                max="24"
                value={parseInt(fontSize)}
                onChange={(e) => setFontSize(`${e.target.value}px`)}
                className="w-full"
              />
            </div>

            <div>
              <h4 className="font-semibold mb-2">Font Family</h4>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {Object.keys(fontFamilies).map(font => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Highlight Menu */}
      {showHighlightMenu && (
        <div
          className="absolute z-50 bg-white shadow-lg rounded-lg p-2"
          style={{
            left: `${highlightPosition.x}px`,
            top: `${highlightPosition.y}px`,
            transform: 'translate(-50%, -100%)',
            width: '180px'
          }}
        >
          <div className="flex gap-2 justify-center">
            {HIGHLIGHT_COLORS.map(color => (
              <button
                key={color.name}
                onClick={() => handleHighlight(color.value)}
                className="w-8 h-8 rounded-full hover:scale-110 transition-transform"
                style={{ 
                  backgroundColor: color.value,
                  border: '2px solid white',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Annotation Menu */}
      {showAnnotationMenu && (
        <div
          className="absolute z-50 bg-white shadow-lg rounded-2xl p-3"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '260px',
            maxHeight: '300px',
            overflow: 'auto'
          }}
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-semibold text-sm">
                {currentAnnotation?.timestamp ? 'Edit Annotation' : 'Add Annotation'}
              </h4>
              <button
                onClick={() => setShowAnnotationMenu(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            
            <div className="selected-text p-2 bg-gray-50 rounded-lg text-xs max-h-16 overflow-auto">
              {currentAnnotation?.text}
            </div>

            {currentAnnotation?.timestamp && (
              <div className="text-xs text-gray-500">
                Created: {new Date(currentAnnotation.timestamp).toLocaleString()}
                {currentAnnotation.lastModified && (
                  <div>
                    Modified: {new Date(currentAnnotation.lastModified).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Comment
              </label>
              <textarea
                value={annotationComment}
                onChange={(e) => setAnnotationComment(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm resize-none"
                rows="2"
                placeholder="Add your notes..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex items-center border rounded-lg p-1.5">
                <FiTag className="w-3 h-3 text-gray-400 mr-1" />
                <input
                  value={annotationTags}
                  onChange={(e) => setAnnotationTags(e.target.value)}
                  className="flex-1 outline-none text-xs"
                  placeholder="Add tags (comma separated)"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowAnnotationMenu(false)}
                className="px-2 py-1 rounded-lg border hover:bg-gray-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={currentAnnotation?.timestamp ? handleUpdateAnnotation : handleSaveAnnotation}
                className="px-2 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1 text-xs"
              >
                <FiCheck className="w-3 h-3" />
                {currentAnnotation?.timestamp ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Reader */}
      <div className="flex-1 relative" style={customStyles.container}>
        <ReactReader
          url={`/uploads/${params.bookId}.epub`}
          location={location}
          locationChanged={handleLocationChanged}
          getRendition={onRenditionReady}
          showToc={showTOC}
          styles={customStyles}
        />
      </div>

      {/* Bookmarks Panel */}
      {showBookmarks && (
        <div
          className="absolute right-4 top-16 bg-white shadow-xl p-6 rounded-lg z-50 w-72"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Bookmarks</h3>
            <button
              onClick={() => setShowBookmarks(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <ul className="space-y-2 max-h-60 overflow-auto">
            {bookmarks.map((bookmark, index) => (
              <li
                key={index}
                className="px-4 py-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
              >
                <span
                  onClick={() => {
                    renditionRef.current?.display(bookmark);
                    setShowBookmarks(false);
                  }}
                  className="flex-1"
                >
                  Bookmark {index + 1}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBookmark(bookmark);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-200"
                  title="Delete bookmark"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
