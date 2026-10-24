export const stages = ['Make a first impression','Explain your value','Build confidence','Invite action'] as const;
export const catalog = [
  {id:'header',label:'Header',detail:'Help visitors find their way.',stage:0},
  {id:'hero',label:'Hero',detail:'Say what you offer and why it matters.',stage:0},
  {id:'logos',label:'Partner logos',detail:'Show the partners people recognize.',stage:0},
  {id:'services',label:'Services',detail:'Explain the products or services you offer.',stage:0},
  {id:'proof',label:'Why choose us',detail:'Give people a reason to choose you.',stage:1},
  {id:'about',label:'About & gallery',detail:'Introduce your business through words and photos.',stage:1},
  {id:'pains',label:'Customer concerns',detail:'Address what might hold someone back.',stage:1},
  {id:'solutions',label:'Our process',detail:'Explain what happens, step by step.',stage:1},
  {id:'trust',label:'Trust signals',detail:'Back up your claims with real evidence.',stage:2},
  {id:'reviews',label:'Reviews',detail:'Let customers share their experience.',stage:2},
  {id:'quote',label:'Quote request',detail:'Make it easy to request an estimate.',stage:2},
  {id:'faq',label:'FAQ',detail:'Answer common questions before people ask.',stage:2},
  {id:'promo',label:'Promotion',detail:'Present an offer with clear terms.',stage:3},
  {id:'contact',label:'Contact',detail:'Show people how to reach you.',stage:3},
  {id:'closing',label:'Final call to action',detail:'Help visitors take the next step.',stage:3},
  {id:'footer',label:'Footer',detail:'Keep useful links and details close by.',stage:3},
] as const;
export type SectionId = typeof catalog[number]['id'];
export const sectionName=(type:SectionId)=>catalog.find(section=>section.id===type)!.label;
