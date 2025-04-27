from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import predict_stock

app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    ticker = data['symbol']
    date_range = data.get('date_range', '60d')  # default to '60d' if not provided

    result = predict_stock(ticker, date_range)

    if isinstance(result, dict) and "error" in result:
        return jsonify(result), 400

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
