; saved on 2026.04.17 18:02:51
; this file contains input parameters for testing/optimizing Scalper Deriv expert advisor
; to use it in the strategy tester, click Load in the context menu of the Inputs tab
;
; Support & Links
Inp_ProductLink=https://www.mql5.com/en/market/product/104565
Inp_TelegramSetFiles=https://t.me/+geAsOlnUtsZmMzQx
Inp_MQL5Channel=https://www.mql5.com/en/channels/02ab1cc3d332dc01
Inp_Broker_ICMarkets=https://icmarkets.com/?camp=86870
Inp_Broker_Deriv=https://track.deriv.com/_O0fhVFuakaoIMV8JnZ5O5GNd7ZgqdRLk/1/
; Main Settings
profitPerCycle=0.8||0.2||0.1||1||Y
typePosition=2||0||0||2||Y
factorTP=5||1||1||10||Y
factorA=23||1||1||30||Y
factorB=15||1||1||30||Y
factorC=17||1||1||50||Y
fractalMaxMin=60||5||5||60||Y
generalStopLoss=100||100.0||10.000000||1000.000000||N
maxOpenTrades=10||3||1||10||Y
Magic=20260417||20251010||1||202510100||N
allowNewCyclesIfNoOthers=false||false||0||true||N
; News Filter
UseNewsFilter=true||false||0||true||N
MinutesBefore=30||30||1||300||N
MinutesAfter=30||30||1||300||N
; Trading Hours
useTradingHours=false||false||0||true||N
startHour=02:00
endHour=22:30
; Trading Days
TradeMonday=true||false||0||true||N
TradeTuesday=true||false||0||true||N
TradeWednesday=true||false||0||true||N
TradeThursday=true||false||0||true||N
TradeFriday=true||false||0||true||N
TradeSaturday=true||false||0||true||N
TradeSunday=true||false||0||true||N
; Display
showDisplay=true||false||0||true||N
displayBgColor=0
displayTextColor=16777215
displayCorner=0||0||0||3||N
displayX=20||20||1||200||N
displayY=30||30||1||300||N