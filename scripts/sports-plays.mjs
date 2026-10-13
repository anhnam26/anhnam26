// Authored, repeatable plays. Roles are mirrored with the scoring team.
const pass=(from,to,release,catchAt)=>({from,to,release,catchAt});
const shot=(role,release,crest,style='shot')=>({role,release,crest,style});
export const FOOTBALL_PLAYS = [
  {name:'Tackle recovery and wall pass',turnover:true,passes:[pass('lead','mate',3.15,3.7),pass('mate','lead',3.85,4.15)],shot:shot('lead',7.2,226)},
  {name:'Wing run and cutback',turnover:false,passes:[pass('lead','mate',3.15,3.7),pass('mate','lead',5.2,5.8)],shot:shot('lead',7.2,252)},
  {name:'Feint and long-range finish',turnover:false,passes:[],shot:shot('lead',5.9,162)},
  {name:'Overlap and winger finish',turnover:true,passes:[pass('lead','mate',3.15,3.7)],shot:shot('mate',7.2,232)},
  {name:'Interception and solo counterattack',turnover:true,passes:[],shot:shot('lead',7.2,204)},
];
export const BASKETBALL_PLAYS = [
  {name:'Crossover pull-up',turnover:false,passes:[],shot:shot('lead',7.2,100)},
  {name:'Give-and-go jumper',turnover:true,passes:[pass('lead','mate',3.2,3.85),pass('mate','lead',4.25,5.15)],shot:shot('lead',7.2,88)},
  {name:'Steal and fast-break layup',turnover:true,passes:[],shot:shot('lead',7.2,96,'layup')},
  {name:'Backdoor cut and extra pass',turnover:false,passes:[pass('lead','mate',3.2,3.85),pass('mate','lead',4.25,5.15),pass('lead','mate',5.6,6.2)],shot:shot('mate',7.2,84)},
  {name:'Post entry and spin jumper',turnover:true,passes:[pass('lead','mate',3.2,3.85),pass('mate','lead',4.25,5.15)],shot:shot('lead',7.2,112,'post')},
];
export const playFor=(sport,round)=>(sport==='football'?FOOTBALL_PLAYS:BASKETBALL_PLAYS)[round.index??0];

// These corners stay clear of the losing side's attempted dig and block.
export const VOLLEYBALL_LANDINGS = [[980,292],[205,288],[990,270],[185,266],[228,260]];
