import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [content, setContent] = useState('');
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/todos');
      setTodos(res.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setLoading(true);
    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/todos/${editId}`, { content });
        setEditId(null);
      } else {
        await axios.post('http://localhost:5000/api/todos', { content });
      }
      setContent('');
      fetchTodos();
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (todo) => {
    setEditId(todo._id);
    setContent(todo.content);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/todos/${id}`);
      fetchTodos();
    } catch (error) {
      console.error('Error deleting content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditId(null);
    setContent('');
  };

  const getHeatmapData = () => {
    const map = {};
    todos.forEach(todo => {
      const date = new Date(todo.createdAt).toISOString().split('T')[0];
      map[date] = (map[date] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  };

  const [hoveredDay, setHoveredDay] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const getHeatmapTooltip = (value) => {
    if (!value || !value.date) return null;
    const count = value.count || 0;
    const date = new Date(value.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    return `${count} ${count === 1 ? 'entry' : 'entries'} on ${date}`;
  };

  const handleMouseEnter = (event, value) => {
    if (value && value.date) {
      const rect = event.target.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setHoveredDay(value);
    }
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const handleDayClick = (value) => {
    if (value && value.date && value.count > 0) {
      setSelectedDay(selectedDay?.date === value.date ? null : value);
    }
  };

  const getEntriesForDate = (date) => {
    return todos.filter(todo => {
      const todoDate = new Date(todo.createdAt).toISOString().split('T')[0];
      return todoDate === date;
    });
  };

  const getCurrentStreak = () => {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    while (currentDate >= new Date(new Date().setMonth(new Date().getMonth() - 3))) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasEntry = todos.some(todo => {
        const todoDate = new Date(todo.createdAt).toISOString().split('T')[0];
        return todoDate === dateStr;
      });
      
      if (hasEntry) {
        streak++;
      } else if (streak > 0) {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };

  const getTotalActiveDays = () => {
    const uniqueDates = new Set();
    todos.forEach(todo => {
      const date = new Date(todo.createdAt).toISOString().split('T')[0];
      uniqueDates.add(date);
    });
    return uniqueDates.size;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">📝</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Content Tracker</h1>
                <p className="text-sm text-gray-500">Your daily thoughts and ideas</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-700">{todos.length}</p>
              <p className="text-sm text-gray-500">Total Entries</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Input Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editId ? '✏️ Edit Content' : '➕ Add New Content'}
                </h2>
                {editId && (
                  <button
                    onClick={handleCancel}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ✕ Cancel
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <textarea
                    placeholder="What's on your mind today? Share your thoughts, ideas, notes, or any content..."
                    className="w-full border-2 border-gray-200 rounded-lg p-4 h-40 resize-vertical focus:border-blue-500 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {content.length} characters
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button 
                    type="submit" 
                    disabled={loading || !content.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>{editId ? '💾 Update Content' : '🚀 Add Content'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Content List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">📚 Your Content</h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {todos.length} {todos.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              
              {loading && todos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading your content...</p>
                </div>
              ) : todos.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No content yet</h3>
                  <p className="text-gray-500">Start by adding your first thought or idea above!</p>
                </div>
              ) : (
                todos.map((todo, index) => (
                  <div key={todo._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          #{todos.length - index}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(todo.createdAt).toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })} at {new Date(todo.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(todo)} 
                          className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                          title="Edit content"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(todo._id)} 
                          className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                          title="Delete content"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {todo.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Heatmap */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">🔥 Activity Heatmap</h2>
                <p className="text-sm text-gray-500">Your content creation activity over the last 3 months</p>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-green-700">{getCurrentStreak()}</p>
                  <p className="text-xs text-green-600">Day Streak</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-blue-700">{getTotalActiveDays()}</p>
                  <p className="text-xs text-blue-600">Active Days</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-purple-700">
                    {todos.filter(todo => {
                      const today = new Date().toISOString().split('T')[0];
                      const todoDate = new Date(todo.createdAt).toISOString().split('T')[0];
                      return todoDate === today;
                    }).length}
                  </p>
                  <p className="text-xs text-purple-600">Today</p>
                </div>
              </div>
              
              <div className="relative heatmap-container">
                <CalendarHeatmap
                  startDate={new Date(new Date().setMonth(new Date().getMonth() - 3))}
                  endDate={new Date()}
                  values={getHeatmapData()}
                  classForValue={(value) => {
                    if (!value || value.count === 0) return 'color-empty';
                    if (value.count === 1) return 'color-scale-1';
                    if (value.count === 2) return 'color-scale-2';
                    if (value.count <= 4) return 'color-scale-3';
                    return 'color-scale-4';
                  }}
                  onMouseOver={(event, value) => handleMouseEnter(event, value)}
                  onMouseLeave={handleMouseLeave}
                  onClick={(value) => handleDayClick(value)}
                  showWeekdayLabels={true}
                  showMonthLabels={true}
                />
                
                {/* Custom Tooltip */}
                {hoveredDay && (
                  <div 
                    className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none transform -translate-x-1/2 -translate-y-full"
                    style={{
                      left: tooltipPosition.x,
                      top: tooltipPosition.y
                    }}
                  >
                    <div className="text-center">
                      <div className="font-semibold">
                        {hoveredDay.count || 0} {(hoveredDay.count || 0) === 1 ? 'entry' : 'entries'}
                      </div>
                      <div className="text-xs text-gray-300 mt-1">
                        {new Date(hoveredDay.date).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      {hoveredDay.count > 0 && (
                        <div className="text-xs text-blue-300 mt-1">
                          Click to see entries
                        </div>
                      )}
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>Less</span>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-sm color-empty border border-gray-200" title="0 entries"></div>
                  <div className="w-3 h-3 rounded-sm color-scale-1" title="1 entry"></div>
                  <div className="w-3 h-3 rounded-sm color-scale-2" title="2 entries"></div>
                  <div className="w-3 h-3 rounded-sm color-scale-3" title="3-4 entries"></div>
                  <div className="w-3 h-3 rounded-sm color-scale-4" title="5+ entries"></div>
                </div>
                <span>More</span>
              </div>
              
              {/* Selected Day Details */}
              {(selectedDay || (hoveredDay && hoveredDay.count > 0)) && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 animate-fadeIn">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-800">
                      📅 {new Date((selectedDay || hoveredDay).date).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </h4>
                    {selectedDay && (
                      <button 
                        onClick={() => setSelectedDay(null)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        ✕ Close
                      </button>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        {(selectedDay || hoveredDay).count} {(selectedDay || hoveredDay).count === 1 ? 'entry' : 'entries'}
                      </span>
                      <span className="text-blue-600">
                        {Math.round(((selectedDay || hoveredDay).count / todos.length) * 100)}% of total
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {getEntriesForDate((selectedDay || hoveredDay).date).map((entry, index) => (
                      <div key={entry._id} className="text-sm bg-white p-3 rounded-lg border border-blue-100 hover:border-blue-200 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                            #{todos.length - todos.indexOf(entry)}
                          </span>
                          <span className="text-xs text-blue-500">
                            {new Date(entry.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                          {selectedDay ? entry.content : (
                            entry.content.length > 80 
                              ? `${entry.content.substring(0, 80)}...` 
                              : entry.content
                          )}
                        </p>
                        {!selectedDay && entry.content.length > 80 && (
                          <button 
                            onClick={() => setSelectedDay(hoveredDay)}
                            className="text-blue-500 hover:text-blue-700 text-xs mt-1"
                          >
                            Read more →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {!selectedDay && (
                    <div className="mt-3 text-center">
                      <button 
                        onClick={() => setSelectedDay(hoveredDay)}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        👁️ View all entries for this day
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
