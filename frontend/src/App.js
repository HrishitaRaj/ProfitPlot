import React, { useState, useRef } from 'react';
import { useEffect } from 'react'; 
import axios from 'axios';
import './App.css';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { FaApple, FaGoogle, FaMicrosoft, FaAmazon, FaCar, FaFacebook } from 'react-icons/fa';
import { SiNvidia, SiNetflix, SiAdobe, SiPaypal, SiIntel, SiSalesforce, SiVisa, SiMastercard, SiWalmart, SiCocacola } from 'react-icons/si';

// Register ChartJS modules
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, annotationPlugin);

const popularStocks = [
  { name: 'Apple', symbol: 'AAPL', icon: <FaApple /> },
  { name: 'Google', symbol: 'GOOG', icon: <FaGoogle /> },
  { name: 'Microsoft', symbol: 'MSFT', icon: <FaMicrosoft /> },
  { name: 'Amazon', symbol: 'AMZN', icon: <FaAmazon /> },
  { name: 'Tesla', symbol: 'TSLA', icon: <FaCar /> },
  { name: 'Meta (Facebook)', symbol: 'META', icon: <FaFacebook /> },
  { name: 'NVIDIA', symbol: 'NVDA', icon: <SiNvidia /> },
  { name: 'Netflix', symbol: 'NFLX', icon: <SiNetflix /> },
  { name: 'Adobe', symbol: 'ADBE', icon: <SiAdobe /> },
  { name: 'PayPal', symbol: 'PYPL', icon: <SiPaypal /> },
  { name: 'Intel', symbol: 'INTC', icon: <SiIntel /> },
  { name: 'Salesforce', symbol: 'CRM', icon: <SiSalesforce /> },
  { name: 'Visa', symbol: 'V', icon: <SiVisa /> },
  { name: 'Mastercard', symbol: 'MA', icon: <SiMastercard /> },
  { name: 'Walmart', symbol: 'WMT', icon: <SiWalmart /> },
  { name: 'Coca-Cola', symbol: 'KO', icon: <SiCocacola /> },
  { name: 'PepsiCo', symbol: 'PEP', icon: <SiCocacola /> }, 
];

function App() {
  const [historicalPrices, setHistoricalPrices] = useState([]);
  const [predictedPrice, setPredictedPrice] = useState([]);
  const [symbol, setSymbol] = useState(localStorage.getItem('lastSymbol') || '');
  const [recentSymbols, setRecentSymbols] = useState([]);
  const [sentiment, setSentiment] = useState('');
  const [dateRange, setDateRange] = useState('60d');  // default 60 days
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentSymbols')) || [];
    setRecentSymbols(recent);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const response = await axios.post('http://127.0.0.1:5000/predict', { 
        symbol, 
        date_range: dateRange
      });
      const data = response.data;

      if (!data.historical_price || !data.predicted_price) {
        throw new Error('Invalid symbol or server error');
      }

      setHistoricalPrices(data.historical_price);
      setPredictedPrice(data.predicted_price);
      setSentiment(data.sentiment);
      // Save recent symbols
      let recent = JSON.parse(localStorage.getItem('recentSymbols')) || [];
      if (!recent.includes(symbol)) {
        recent.unshift(symbol); // add at start
        if (recent.length > 5) recent.pop(); // keep max 5
      }
      localStorage.setItem('recentSymbols', JSON.stringify(recent));
      setRecentSymbols(recent);

      if (chartRef.current) {
        chartRef.current.scrollIntoView({ behavior: 'smooth' });
      }      
    } catch (err) {
      console.error(err);
      setError('Failed to fetch prediction. Please check the stock symbol or try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase();
    setSymbol(value);

    if (value.length === 0) {
      setSuggestions([]);
      return;
    }

    const filtered = popularStocks.filter(
      (stock) =>
        stock.symbol.startsWith(value) || stock.name.toLowerCase().includes(value.toLowerCase())
    );

    setSuggestions(filtered);
  };

  const handleSuggestionClick = (stockSymbol) => {
    setSymbol(stockSymbol);
    setSuggestions([]);
  };

  const handlePopularClick = (stockSymbol) => {
    setSymbol(stockSymbol);
    setSuggestions([]);
  };

  const handleReset = () => {
    setHistoricalPrices([]);
    setPredictedPrice([]);
    setSymbol('');
    setError('');
    setSentiment('');
  };

  const prepareChartData = () => {
    const realPrices = historicalPrices.map(item => item[0]);
    const labels = realPrices.map((_, idx) => `Day ${idx + 1}`);
    const futureLabels = predictedPrice.length ? predictedPrice.map((_, idx) => `Future ${idx + 1}`) : [];

    return {
      labels: [...labels, ...futureLabels],
      datasets: [
        {
          label: 'Historical Prices',
          data: realPrices,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          fill: false,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 4,
        },
        {
          label: 'Predicted Prices',
          data: new Array(realPrices.length).fill(null).concat(predictedPrice),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderDash: [5, 5],
          fill: false,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 5,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    animations: {
      tension: {
        duration: 1000,
        easing: 'easeInOutQuad',
        from: 0.3,
        to: 0.5,
      },
    },
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `$${context.parsed.y.toFixed(2)}`;
          }
        }
      },
      annotation: {
        annotations: {
          line1: {
            type: 'line',
            xMin: historicalPrices.length,
            xMax: historicalPrices.length,
            borderColor: 'red',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              content: 'Prediction Starts',
              enabled: true,
              position: 'start',
              color: 'red',
              font: {
                style: 'bold',
              },
              backgroundColor: 'rgba(255,255,255,0.7)',
            },
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      }
    }
  };

  return (
    <div className="min-h-screen p-6 font-sans bg-gradient-to-br from-gray-50 to-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Stock Price Prediction</h1>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
        <input
          type="text"
          value={symbol}
          onChange={handleInputChange}
          placeholder="Enter Stock Symbol or Name"
          className="border border-gray-300 rounded px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          required
        />
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="60d">Last 60 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2 transition duration-200"
          >
            Predict
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="bg-gray-400 hover:bg-gray-500 text-white rounded px-4 py-2 transition duration-200"
          >
            Reset
          </button>
        </div>

        {suggestions.length > 0 && (
          <ul className="absolute bg-white border border-gray-300 rounded mt-1 w-64 shadow-lg z-20">
          {suggestions.map((stock, index) => (
            <li
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSuggestionClick(stock.symbol)}
            >
              {stock.name} ({stock.symbol})
            </li>
          ))}
        </ul>
        )}
      </form>

      {/* Popular Stocks */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-gray-700">Popular Stocks:</h2>
        <div className="flex flex-wrap gap-2">
          {popularStocks.map((stock, index) => (
            <button 
            key={index} 
            className="bg-white border border-gray-300 hover:shadow-lg text-gray-700 rounded px-3 py-1 transition duration-200 flex items-center gap-2"
            onClick={() => handlePopularClick(stock.symbol)}
          >
            {stock.icon} {stock.symbol}
          </button>
          ))}
        </div>
      </div>

      {recentSymbols.length > 0 && (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-gray-700">Recently Viewed:</h2>
        <div className="flex flex-wrap gap-2">
          {recentSymbols.map((symbol, index) => (
            <button
            key={index}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 rounded px-3 py-1 transition duration-200 shadow-sm"
            onClick={() => handlePopularClick(symbol)}
          >
            {symbol}
          </button>
          ))}
        </div>
      </div>
    )}

      {loading && (
        <div className="flex justify-center items-center my-8">
          <div className="spinner"></div>
        </div>
      )}

      {error && <p className="text-red-600 text-center mb-4">{error}</p>}

      {predictedPrice.length > 0 && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">
            7-Day Predicted Prices
          </h2>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {predictedPrice.map((price, index) => (
              <div key={index} className="bg-blue-100 text-blue-800 px-4 py-3 rounded shadow transition hover:scale-105 duration-200">
                Day {index + 1}: <span className="font-semibold">${price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className={`p-4 mt-6 rounded shadow-md text-lg font-medium ${sentiment.includes('Bullish') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {sentiment}
          </div>
        </div>
      )}

      <div ref={chartRef}>
      {historicalPrices.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-gray-800">Price Trend:</h3>
        <Line data={prepareChartData()} options={chartOptions} />
      </div>
      )}
      </div>
    </div>
  );
}

export default App;
