from flask import Response
from coinmarketcap import Market
from prometheus_client import CollectorRegistry, Gauge, generate_latest

tickers = (
  {'marketcap_id': 1, 'ticker': 'btc', 'target': True},
  {'marketcap_id': 2, 'ticker': 'ltc'},
  # {'marketcap_id': 825, 'ticker': 'usdt'},
  {'marketcap_id': 1027, 'ticker': 'eth'},
  # {'marketcap_id': 52, 'ticker': 'xrp'},
  {'marketcap_id': 1831, 'ticker': 'bch'},
)

def coin(request):
  """
  Coin metrics endpoint
  """

  registry = CollectorRegistry()
  market = Market()

  for ticker in tickers:
    t = ticker['ticker']
    T = t.upper()
    data = market.ticker(ticker['marketcap_id'], convert='USD')['data']
    g = Gauge('{}_supply'.format(t), '{} supply'.format(T), labelnames=['ft_target'], registry=registry)
    g.labels(ft_target='true').set(data['total_supply'])

    usd = data['quotes']['USD']
    g = Gauge('{}_usd'.format(t), '{}/USD price'.format(T), labelnames=['predict_linear', 'predict_arima', 'predict_ltsm', 'ft_target'], registry=registry)
    g.labels(predict_linear='true', predict_arima='true', predict_ltsm='true', ft_target='true').set(usd['price'])
    g = Gauge('{}_vol'.format(t), '{} volume'.format(T),  labelnames=['ft_target'], registry=registry)
    g.labels(ft_target='true').set(usd['volume_24h'])

  return Response(generate_latest(registry), mimetype="text/plain")