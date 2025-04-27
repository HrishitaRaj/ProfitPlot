import yfinance as yf
import numpy as np
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler

# Load the trained model
model = load_model('../stock_lstm_model.h5')

def predict_stock(ticker, date_range='60d'):
    try:
        # Download last 60 days of data
        data = yf.download(ticker, period=date_range, interval="1d")
        if data.empty:
            return {"error": "No data found for ticker."}

        close_prices = data['Close'].values.reshape(-1, 1)

        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(close_prices)

        # Prepare input
        X_test = []
        X_test.append(scaled_data[-60:])
        X_test = np.array(X_test)
        X_test = np.reshape(X_test, (X_test.shape[0], X_test.shape[1], 1))

        # 7-Day Future Prediction
        future_prices = []
        input_seq = X_test[0]

        for _ in range(7):
            input_seq_reshaped = np.reshape(input_seq, (1, input_seq.shape[0], 1))
            predicted_scaled = model.predict(input_seq_reshaped, verbose=0)
            predicted_price = scaler.inverse_transform(predicted_scaled)

            future_prices.append(float(predicted_price[0][0]))

            # Update input sequence: remove first, append predicted
            new_input = predicted_scaled
            input_seq = np.append(input_seq[1:], new_input, axis=0)

        # Sentiment analysis
        recent_prices = data['Close'].tail(14)
        price_change = recent_prices.iloc[-1] - recent_prices.iloc[0]
        price_change = float(price_change)

        if price_change > 0:
            sentiment = "🟢 Bullish Trend (Expected growth)"
        elif price_change < 0:
            sentiment = "🔴 Bearish Trend (Expected fall)"
        else:
            sentiment = "⚪ Neutral Trend (No significant change)"

        historical_price = data['Close'].values.tolist()

        return {
            "predicted_price": future_prices,  # Now 7 future prices
            "historical_price": historical_price,
            "sentiment": sentiment
        }

    except Exception as e:
        print("Error in predict_stock function:", str(e))
        return {"error": str(e)}
