import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';

const TradingViewWidget = () => {
  const chartContainerRef = useRef();
  const candlestickSeriesRef = useRef();
  const chartRef = useRef();

  useEffect(() => {
    // Create the chart
    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#1e1e1e' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2c2c2e' },
        horzLines: { color: '#2c2c2e' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });

    // Add candlestick series using v5 API
    candlestickSeriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Initial dummy data
    candlestickSeriesRef.current.setData([
      { time: Math.floor(Date.now() / 1000) - 60, open: 100, high: 110, low: 90, close: 105 },
    ]);

    // Simulate live data every second
    const interval = setInterval(() => {
      const lastBarTime = Math.floor(Date.now() / 1000);
      const lastPrice = Math.random() * (110 - 90) + 90;

      candlestickSeriesRef.current.update({
        time: lastBarTime,
        open: lastPrice - 2,
        high: lastPrice + 2,
        low: lastPrice - 3,
        close: lastPrice,
      });
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      chartRef.current.remove();
    };
  }, []);

  return (
    <div
      ref={chartContainerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '400px',
        margin: '0 auto',
      }}
    />
  );
};

export default TradingViewWidget;
