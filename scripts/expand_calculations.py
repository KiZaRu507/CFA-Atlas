"""Deterministic original numerical variants. Assumptions and error paths explicit."""
import json,pathlib,math
bank={}
for file in pathlib.Path('public/content').glob('v*.json'):
 for c in json.loads(file.read_text()):bank[c['id']]=c

def emit(mid,n,prompt,correct,wrong1,wrong2,why,difficulty=2):
 c=bank[mid+'-c1'];qid=c['id']+f'-calc{n}';vals=[correct,wrong1,wrong2]
 assert len(set(vals))==3,(qid,vals)
 rotation=n%3;choices=vals[rotation:]+vals[:rotation];answer=choices.index(correct)
 c['questions'].append({'id':qid,'conceptId':c['id'],'moduleId':mid,'topicId':c['topicId'],'prompt':prompt,'choices':choices,'answer':answer,'explanation':why,'distractors':[('Correct.' if i==answer else 'This result follows a common sign, denominator, timing or compounding error. '+why) for i in range(3)],'difficulty':difficulty,'type':'calculation','source':c['source']})
def num(v):return f'{v:,.2f}'
def pct(v):return num(v*100)+'%'
for n in range(1,6):
 r=.03+n*.01;fv=1500+n*200;t=2+n%3
 emit('v1-m2',n,f'A single payment of {fv:,} arrives in {t} years. The annual effective required return is {pct(r)}. Present value is closest to:',num(fv/(1+r)**t),num(fv/(1+r)),num(fv*(1+r)**t),f'Draw the timeline, then discount each of the {t} periods: {fv}/(1+{r:.2f})^{t} = {num(fv/(1+r)**t)}. Dividing once ignores time; multiplying compounds in the wrong direction.')
 gain=.10+n*.02;loss=-.04-n*.01;g=math.sqrt((1+gain)*(1+loss))-1
 emit('v1-m1',n,f'With no external cash flows, annual returns are {pct(gain)} and {pct(loss)}. Annualized geometric return is closest to:',pct(g),pct((gain+loss)/2),pct((1+gain)*(1+loss)-1),f'Compound wealth factors, then annualize: √[(1+{gain:.2f})(1{loss:.2f})] − 1 = {pct(g)}. The arithmetic mean ignores volatility drag; the cumulative return is not annualized.')
 prior=.05+n*.02;lik=.70;false=.15;post=prior*lik/(prior*lik+(1-prior)*false)
 emit('v1-m4',n,f'Default prior is {pct(prior)}. A warning occurs in 70% of defaults and 15% of non-defaults. P(default | warning) is closest to:',pct(post),'70.00%',pct(prior*lik),f'Joint probability = {prior:.2f}×.70. Total warning probability = {prior:.2f}×.70 + {1-prior:.2f}×.15. Divide joint by total to get {pct(post)}. The likelihood and joint probability are not the posterior.',3)
 vol=.10+n*.02;rho=.1*n;var=.5*vol**2*(1+rho)
 emit('v1-m5',n,f'Two equally weighted assets each have volatility {pct(vol)} and correlation {rho:.1f}. Portfolio volatility is closest to:',pct(math.sqrt(var)),pct(vol),pct(vol/2),f'Variance = .25σ² + .25σ² + .5σ²ρ = {var:.6f}. Square root gives {pct(math.sqrt(var))}. Neither average volatility nor half one asset’s volatility captures covariance.',3)
 sigma=12+n*3;size=(5+n)**2
 emit('v1-m7',n,f'Independent observations have standard deviation {sigma} and sample size {size}. Standard error of the mean is closest to:',num(sigma/math.sqrt(size)),num(sigma/size),num(sigma),f'SE = σ/√n = {sigma}/√{size} = {num(sigma/math.sqrt(size))}. Dividing by n understates the error; σ is dispersion of observations, not the sample mean.')
 b0=1+n;b1=.8+n*.2;x=4+n
 emit('v1-m10',n,f'Estimated regression is Ŷ = {b0} + {b1:.1f}X. For X = {x}, the predicted outcome is:',num(b0+b1*x),num(b1*x),num((b0+b1)*x),f'Add the intercept to slope times X: {b0}+{b1:.1f}×{x}={num(b0+b1*x)}. Do not omit or multiply the intercept.')
 spot=70+n*2;rd=.05+n*.005;rf=.03
 emit('v2-m8',n,f'Spot is {spot} domestic currency units per foreign unit. One-year domestic rate is {pct(rd)} and foreign rate 3%. The covered forward is closest to:',num(spot*(1+rd)/(1+rf)),num(spot*(1+rf)/(1+rd)),num(spot),f'For this quote, F=S(1+r_d)/(1+r_f) = {spot}×{1+rd:.3f}/1.03 = {num(spot*(1+rd)/(1+rf))}. Inverting the interest ratio prices the opposite quote incorrectly.')
 dio=40+n*3;dso=20+n;dpo=25+n*2
 emit('v3-m4',n,f'Inventory days are {dio}, receivable days {dso} and payable days {dpo}. Cash conversion cycle is:',f'{dio+dso-dpo} days',f'{dio+dso+dpo} days',f'{dio+dso} days',f'CCC = DIO + DSO − DPO = {dio}+{dso}−{dpo} = {dio+dso-dpo}. Supplier financing reduces the time for which cash is tied up.')
 cf=125+n*10;cost=100;r=.08
 emit('v3-m5',n,f'Invest 100 today for a single {cf} cash inflow in two years. Required annual return is 8%. NPV is closest to:',num(cf/1.08**2-cost),num(cf-cost),num(cf/1.08-cost),f'NPV = −100+{cf}/1.08² = {num(cf/1.08**2-100)}. Undiscounted profit and one-period discounting both overstate value.')
 wd=.25+n*.05;rd=.05;re=.10;tax=.25;wacc=wd*rd*(1-tax)+(1-wd)*re
 emit('v3-m6',n,f'Debt weight is {pct(wd)} at 5%; equity weight {pct(1-wd)} at 10%. Tax is 25% and interest is deductible. WACC is closest to:',pct(wacc),pct(wd*rd+(1-wd)*re),pct((wd*rd+(1-wd)*re)*(1-tax)),f'WACC = {wd:.2f}×5%×.75 + {1-wd:.2f}×10% = {pct(wacc)}. Only the debt cost receives the interest tax adjustment.')
 ni=150+n*20;pref=15+n*2;shares=50+n*5
 emit('v4-m2',n,f'Net income is {ni}, preferred dividends {pref}, weighted-average common shares {shares}. Basic EPS is:',num((ni-pref)/shares),num(ni/shares),num((ni+pref)/shares),f'Earnings available to common shareholders are {ni}−{pref}. Divide by {shares} to get {num((ni-pref)/shares)}. Preferred dividends are subtracted, not ignored or added.')
 cfo=100+n*10;interest=10+n;capex=40+n*3;tax=.30
 emit('v4-m5',n,f'CFO of {cfo} includes deduction of interest {interest}. Capex is {capex}, tax 30%. FCFF is closest to:',num(cfo+interest*.7-capex),num(cfo-capex),num(cfo+interest-capex),f'Add after-tax interest, then deduct investment: {cfo}+{interest}×.70−{capex}={num(cfo+interest*.7-capex)}. Omitting the interest adjustment understates FCFF; adding pretax interest overstates it.')
 margin=.05+n*.01;turn=1.2;lev=1.5+n*.2
 emit('v4-m11',n,f'Net margin is {pct(margin)}, asset turnover 1.2 and equity multiplier {lev:.1f}. DuPont ROE is:',pct(margin*turn*lev),pct(margin*turn),pct(margin*lev),f'ROE = margin × turnover × leverage = {margin:.2f}×1.2×{lev:.1f} = {pct(margin*turn*lev)}. Each distractor drops one component.')
 d1=2+n*.5;r=.10;g=.025+n*.002
 emit('v5-m8',n,f'Next dividend is {d1:.2f}, required return 10%, and constant perpetual growth {pct(g)}. Gordon value is closest to:',num(d1/(r-g)),num(d1/r),num(d1*(1+g)/(r-g)),f'Next dividend is already D1. V = {d1:.2f}/(.10−{g:.3f})={num(d1/(r-g))}. Do not ignore growth or grow D1 again.')
 coupon=3+n;y=.06+n*.002;price=(100+coupon)/(1+y)
 emit('v6-m6',n,f'A bond matures in exactly one year, pays annual coupon {coupon} and redeems 100. Required yield is {pct(y)}. Price is closest to:',num(price),num(100+coupon),num(100/(1+y)),f'Discount both coupon and redemption: ({coupon}+100)/(1+{y:.3f}) = {num(price)}. Ignoring discounting or omitting the coupon gives the other values.')
 s1=.03+n*.002;s2=.04+n*.003;fwd=(1+s2)**2/(1+s1)-1
 emit('v6-m9',n,f'One-year annual spot rate is {pct(s1)} and two-year rate {pct(s2)}. The one-year forward starting in one year is:',pct(fwd),pct(s2-s1),pct(s2),f'(1+s₂)²=(1+s₁)(1+f). Thus f={num((1+s2)**2)}/{1+s1:.3f}−1={pct(fwd)}. A simple rate difference is not the forward rate.',3)
 dur=3+n;bps=20+n*10;dy=bps/10000
 emit('v6-m11',n,f'Modified duration is {dur}. Yield rises {bps} basis points. Ignore convexity. Approximate percentage price change is:',pct(-dur*dy),pct(dur*dy),pct(-dur*bps/100),f'Convert {bps} bps to {dy:.4f}. ΔP/P≈−{dur}×{dy:.4f}={pct(-dur*dy)}. The sign is negative and basis points require division by 10,000.')
 dur=4+n*.5;conv=30+n*5;dy=.01;res=-dur*dy+.5*conv*dy*dy
 emit('v6-m12',n,f'Duration {dur:.1f}, convexity {conv}, yield increase 1%. Approximate price change including convexity is:',pct(res),pct(-dur*dy-.5*conv*dy*dy),pct(-dur*dy+conv*dy*dy),f'−{dur:.1f}×.01 + ½×{conv}×.01² = {pct(res)}. Positive convexity adds; retain the one-half factor.',3)
 ead=1000+n*100;pd=.01+n*.005;recovery=.40
 emit('v6-m14',n,f'Exposure is {ead}, default probability {pct(pd)}, recovery 40%. Expected loss is:',num(ead*pd*.6),num(ead*pd*.4),num(ead*pd),f'LGD=1−.40=.60. Expected loss = {ead}×{pd:.3f}×.60={num(ead*pd*.6)}. Multiplying by recovery computes the wrong quantity.')
 ebit=90+n*12;interest=18+n
 emit('v6-m16',n,f'EBIT is {ebit} and interest expense {interest}. EBIT interest coverage is closest to:',num(ebit/interest)+'×',num(interest/ebit)+'×',num(ebit-interest)+'×',f'Coverage = EBIT/interest = {ebit}/{interest}={num(ebit/interest)} times. It is neither the inverse ratio nor the difference.')
 st=60+n*3;k=55;premium=4+n*.5
 emit('v7-m2',n,f'Long call strike {k}, premium {premium:.2f}, expiry stock price {st}. Profit ignoring financing is:',num(st-k-premium),num(st-k),num(st-k+premium),f'Exercise payoff = max({st}−{k},0). Subtract premium {premium:.2f}: profit {num(st-k-premium)}. Premium is a cost, not additional income.')
 spot=100+n*10;r=.04+n*.005
 emit('v7-m4',n,f'Non-income asset spot {spot}, one-year financing {pct(r)}, no storage or other benefits. Fair one-year forward price is:',num(spot*(1+r)),num(spot/(1+r)),num(spot),f'Finance the spot purchase for one year: {spot}×(1+{r:.3f})={num(spot*(1+r))}. Forward carry compounds the purchase cost.')
 stock=100;pvk=93+n;call=10+n;put=call+pvk-stock
 emit('v7-m9',n,f'For matched European options on a non-dividend stock, S = 100, PV(strike) = {pvk} and call = {call}. Put value is:',num(put),num(call+stock-pvk),num(stock-pvk-call),f'c+PV(K)=p+S. Therefore p={call}+{pvk}−100={put}. Reversing the cash/stock side breaks replication.',3)
 noi=120000+n*10000;cap=.05+n*.002
 emit('v8-m4',n,f'Stabilized property NOI is {noi:,} before financing and cap rate {pct(cap)}. Direct-cap value is closest to:',num(noi/cap),num(noi*cap),num(noi/(1+cap)),f'Value = NOI/cap rate = {noi}/{cap:.3f}={num(noi/cap)}. Multiplying by cap rate or discounting only one year does not capitalize the ongoing income stream.')
 rf=.03;rm=.08;beta=.7+n*.2
 emit('v9-m2',n,f'Risk-free return 3%, market expected return 8%, beta {beta:.1f}. CAPM required return is:',pct(rf+beta*(rm-rf)),pct(rf+beta*rm),pct(beta*(rm-rf)),f'Market premium is 8%−3%=5%. Required return = 3%+{beta:.1f}×5%={pct(rf+beta*(rm-rf))}. Use excess market return and then add risk-free return.')
for t in range(1,11):pathlib.Path(f'public/content/v{t}.json').write_text(json.dumps([c for c in bank.values() if c['topicId']==f'v{t}'],ensure_ascii=False,indent=2))
cat=json.load(open('src/data/catalog.json'))
for c in cat:c['questionIds']=[q['id'] for q in bank[c['id']]['questions']]
pathlib.Path('src/data/catalog.json').write_text(json.dumps(cat,ensure_ascii=False,indent=2))
print('Expanded to',sum(len(c['questions']) for c in bank.values()),'total questions/prompts;',sum(bool(q['choices']) for c in bank.values() for q in c['questions']),'MCQs')
