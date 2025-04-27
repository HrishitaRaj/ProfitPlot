import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
import joblib

# Download historical stock prices
def get_stock_data(ticker, start="2015-01-01", end="2024-01-01"):
    data = yf.download(ticker, start=start, end=end)
    return data[['Close']]

# Example
stock_data = get_stock_data('AAPL')
print(stock_data.tail())

# Normalize the data between 0 and 1
scaler = MinMaxScaler()
scaled_data = scaler.fit_transform(stock_data)

# Create sequences
def create_sequences(data, seq_length):
    x = []
    y = []
    for i in range(seq_length, len(data)):
        x.append(data[i-seq_length:i, 0])
        y.append(data[i, 0])
    return np.array(x), np.array(y)

sequence_length = 60  # Use last 60 days to predict next day
X, y = create_sequences(scaled_data, sequence_length)

# Reshape X for LSTM input (samples, time steps, features)
X = np.reshape(X, (X.shape[0], X.shape[1], 1))

# Build the model
model = Sequential()
model.add(LSTM(50, return_sequences=True, input_shape=(X.shape[1], 1)))
model.add(LSTM(50))
model.add(Dense(1))

model.compile(optimizer='adam', loss='mean_squared_error')

# Train the model
model.fit(X, y, epochs=20, batch_size=32)

# Save the model
model.save("stock_lstm_model.h5")
# Save the scaler too (important for later prediction!)
joblib.dump(scaler, "scaler.save")