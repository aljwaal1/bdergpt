const $ = (s)=>document.querySelector(s);
const app = $('#app');
const LS='badr-kids-state-v1';
const state = JSON.parse(localStorage.getItem(LS)||'{"stars":0,"learned":{},"stories":{},"games":0}');
function save(){localStorage.setItem(LS, JSON.stringify(state));}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent='🐻 بدر: '+t;document.body.appendChild(d);setTimeout(()=>d.remove(),1700)}

const VOICE_LS='badr-kids-voice-v2';
let voiceState=JSON.parse(localStorage.getItem(VOICE_LS)||'{"voiceURI":"","rate":0.82,"pitch":1.02}');
function saveVoice(){localStorage.setItem(VOICE_LS,JSON.stringify(voiceState));}
function normalizeArabicText(text){
  // لا نحذف الهمزات والتاء المربوطة؛ حذفها يجعل النطق آلياً ومشوهاً.
  return String(text).replace(/[ـ]/g,'').replace(/\s+/g,' ').trim();
}
function arabicVoices(){
  const voices=speechSynthesis.getVoices?speechSynthesis.getVoices():[];
  return voices.filter(v=>/^ar([-_]|$)/i.test(v.lang)||/Arabic|العربية|Hoda|Naayf|Maged|Majed|Tarik|Microsoft/i.test(v.name));
}
function bestVoice(lang){
  const voices = speechSynthesis.getVoices ? speechSynthesis.getVoices() : [];
  if(lang.startsWith('ar')){
    if(voiceState.voiceURI){const saved=voices.find(v=>v.voiceURI===voiceState.voiceURI); if(saved) return saved;}
    const rank = v => {
      const n=(v.name+' '+v.lang).toLowerCase();
      let score=0;
      if(/^ar[-_]?jo/i.test(v.lang)) score+=50;
      if(/^ar[-_]sa/i.test(v.lang)) score+=45;
      if(/^ar[-_]eg/i.test(v.lang)) score+=35;
      if(/microsoft|google|apple|siri|majed|maged|hoda|naayf|tarik|zeina|laila|mariam|salma/i.test(n)) score+=30;
      if(/compact|default/i.test(n)) score-=10;
      return score;
    };
    return arabicVoices().sort((a,b)=>rank(b)-rank(a))[0] || voices.find(v=>/^ar[-_]/i.test(v.lang)) || null;
  }
  return voices.find(v=>/^en[-_]/i.test(v.lang) && /google|samantha|alex|english|microsoft/i.test(v.name))
      || voices.find(v=>/^en[-_]/i.test(v.lang)) || null;
}
if('speechSynthesis' in window){ speechSynthesis.onvoiceschanged = ()=>speechSynthesis.getVoices(); setTimeout(()=>speechSynthesis.getVoices(),300); }
function speak(text, lang='ar-JO'){
  try{
    speechSynthesis.cancel();
    const clean = lang.startsWith('ar') ? normalizeArabicText(text) : String(text);
    const u=new SpeechSynthesisUtterance(clean);
    u.lang=lang.startsWith('ar')?'ar-JO':lang;
    const v=bestVoice(u.lang); if(v){ u.voice=v; u.lang=v.lang || u.lang; }
    u.rate=lang.startsWith('ar')?Number(voiceState.rate||0.82):0.82;
    u.pitch=lang.startsWith('ar')?Number(voiceState.pitch||1.02):1.02;
    u.volume=1;
    speechSynthesis.speak(u);
  }catch(e){}
}
function voicePanel(){
  const voices=arabicVoices();
  layout(`<div class="row space"><button class="back" onclick="home()">رجوع</button><span class="chip">نطق عربي</span></div><div class="card"><h2 class="title">🔊 إعداد النطق العربي</h2><p class="muted">اختر أفضل صوت عربي موجود على الجهاز. على iPhone/Chrome جودة الصوت تعتمد على الأصوات المثبتة في النظام.</p><select id="voiceSelect" class="select">${voices.map(v=>`<option value="${v.voiceURI}" ${v.voiceURI===voiceState.voiceURI?'selected':''}>${v.name} — ${v.lang}</option>`).join('')||'<option>لا يوجد صوت عربي واضح على هذا الجهاز</option>'}</select><div class="actions"><button class="btn" onclick="voiceState.voiceURI=document.getElementById('voiceSelect').value;saveVoice();speak('مرحباً يا صديقي، أنا بدر الدب. أحسنت يا بطل.','ar-JO')">تجربة الصوت</button><button class="btn alt" onclick="voiceState.rate=0.72;saveVoice();speak('نطق واضح وبطيء.','ar-JO')">أبطأ</button><button class="btn green" onclick="voiceState.rate=0.86;saveVoice();speak('نطق طبيعي وواضح.','ar-JO')">طبيعي</button></div></div>`,'home');
}
function star(key){ if(key && !state.learned[key]){state.learned[key]=1; state.stars++; save(); toast('أحسنت! ربحت نجمة ⭐');} }
function layout(html, tab='home'){app.innerHTML=`<div class="wrap"><div class="top"><div class="hero row"><div class="bear">🐻</div><div><h1>عالم بدر</h1><p>مرحباً يا صديقي، هيا نتعلم ونلعب!</p></div></div></div>${html}</div>${nav(tab)}`}
function nav(on){return `<div class="nav"><button class="${on==='home'?'on':''}" onclick="home()">🏠 الرئيسية</button><button class="${on==='stories'?'on':''}" onclick="stories()">📖 القصص</button><button class="${on==='games'?'on':''}" onclick="games()">🎮 ألعاب</button><button class="${on==='ach'?'on':''}" onclick="achievements()">⭐ إنجازاتي</button></div>`}
const sections=[
 {id:'animals',title:'الحيوانات',emoji:'🐶',hint:'20 حيواناً مع النطق والصوت'},
 {id:'food',title:'الفواكه والخضروات',emoji:'🍎',hint:'20 صورة وكلمة'},
 {id:'transport',title:'وسائل النقل',emoji:'🚗',hint:'20 وسيلة نقل'},
 {id:'colors',title:'الألوان',emoji:'🎨',hint:'10 ألوان أساسية'},
 {id:'shapes',title:'الأشكال',emoji:'🔺',hint:'10 أشكال'},
 {id:'arabic',title:'الحروف العربية',emoji:'🔤',hint:'28 حرفاً'},
 {id:'english',title:'الحروف الإنجليزية',emoji:'🔠',hint:'26 حرفاً'},
 {id:'numbers',title:'الأرقام',emoji:'🔢',hint:'0 إلى 20'},
];
const data={
 animals:[['🦁','أسد','Lion','roar'],['🐯','نمر','Tiger','roar'],['🐘','فيل','Elephant','trumpet'],['🦒','زرافة','Giraffe',''],['🐒','قرد','Monkey','monkey'],['🐻','دب','Bear','roar'],['🐰','أرنب','Rabbit',''],['🦊','ثعلب','Fox',''],['🐴','حصان','Horse','neigh'],['🐄','بقرة','Cow','moo'],['🐑','خروف','Sheep','baa'],['🐐','ماعز','Goat','baa'],['🐫','جمل','Camel',''],['🐶','كلب','Dog','woof'],['🐱','قطة','Cat','meow'],['🐔','دجاجة','Chicken','cluck'],['🦆','بطة','Duck','quack'],['🐟','سمكة','Fish',''],['🐢','سلحفاة','Turtle',''],['🐬','دولفين','Dolphin','']],
 food:[['🍎','تفاح','Apple'],['🍌','موز','Banana'],['🍊','برتقال','Orange'],['🍇','عنب','Grapes'],['🍓','فراولة','Strawberry'],['🍉','بطيخ','Watermelon'],['🍒','كرز','Cherry'],['🥭','مانجو','Mango'],['🍋','ليمون','Lemon'],['🍅','طماطم','Tomato'],['🥒','خيار','Cucumber'],['🥕','جزر','Carrot'],['🥔','بطاطا','Potato'],['🧅','بصل','Onion'],['🌽','ذرة','Corn'],['🥬','خس','Lettuce'],['🫑','فلفل','Pepper'],['🫛','بازلاء','Peas'],['🥦','بروكلي','Broccoli'],['🍍','أناناس','Pineapple']],
 transport:[['🚗','سيارة','Car'],['🚌','حافلة','Bus'],['🚚','شاحنة','Truck'],['🚆','قطار','Train'],['✈️','طائرة','Airplane'],['🚁','مروحية','Helicopter'],['🚢','سفينة','Ship'],['⛵','قارب','Boat'],['🚲','دراجة','Bicycle'],['🏍️','دراجة نارية','Motorcycle'],['🚓','سيارة شرطة','Police car'],['🚑','سيارة إسعاف','Ambulance'],['🚒','سيارة إطفاء','Fire truck'],['🚜','جرار','Tractor'],['🚧','حفارة','Excavator'],['🚋','ترام','Tram'],['🚇','مترو','Metro'],['🚀','صاروخ','Rocket'],['🎈','منطاد','Balloon'],['🛸','مركبة فضائية','Spaceship']],
 colors:[['🔴','أحمر','Red'],['🔵','أزرق','Blue'],['🟢','أخضر','Green'],['🟡','أصفر','Yellow'],['🟠','برتقالي','Orange'],['🟣','بنفسجي','Purple'],['⚫','أسود','Black'],['⚪','أبيض','White'],['🟤','بني','Brown'],['🩷','وردي','Pink']],
 shapes:[['⚪','دائرة','Circle'],['◼️','مربع','Square'],['🔺','مثلث','Triangle'],['▭','مستطيل','Rectangle'],['⭐','نجمة','Star'],['❤️','قلب','Heart'],['🥚','بيضاوي','Oval'],['🔶','معين','Diamond'],['🌙','هلال','Crescent'],['⬟','خماسي','Pentagon']],
 arabic:'أ ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن هـ و ي'.split(' ').map((l,i)=>['🔤',l, ['أسد','بطة','تفاح','ثعلب','جمل','حصان','خروف','دجاجة','ذرة','رمان','زرافة','سمكة','شمس','صاروخ','ضفدع','طائرة','ظرف','عنب','غيمة','فيل','قطة','كلب','ليمون','موز','نمر','هدهد','وردة','يد'][i]||l]),
 english:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l,i)=>['🔠',l, ['Apple','Ball','Cat','Dog','Elephant','Fish','Grapes','House','Ice cream','Juice','Kite','Lion','Moon','Nose','Orange','Pen','Queen','Rabbit','Sun','Tree','Umbrella','Van','Water','Xylophone','Yo-yo','Zebra'][i]]),
 numbers:Array.from({length:21},(_,i)=>['🔢',String(i),['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen','Twenty'][i]])
};
const storiesList=[
 ['الأرنب والسلحفاة','🐰',['كان الأرنب سريعاً جداً.','كانت السلحفاة تمشي ببطء.','بدأ السباق بينهما.','نام الأرنب لأنه ظن أنه سيفوز.','واصلت السلحفاة السير بهدوء.','وصلت السلحفاة أولاً.','تعلم الأرنب ألا يتكبر.']],
 ['النملة والحمامة والصياد','🐜',['سقطت نملة صغيرة في الماء.','رأتها حمامة طيبة.','ألقت الحمامة ورقة للنملة.','صعدت النملة ونجت.','جاء صياد نحو الحمامة.','قرصت النملة قدم الصياد.','طارت الحمامة بسلام.','قالت الحمامة: شكراً يا صديقتي.']],
 ['التراب والماء','🌱',['كانت هناك بذرة صغيرة.','نامت البذرة في التراب.','جاء الماء وسقاها.','بدأت البذرة تكبر.','خرجت نبتة خضراء.','كبرت النبتة وأصبحت زهرة.','قالت الزهرة: شكراً يا تراب ويا ماء.']],
 ['الأسد والفأر','🦁',['نام الأسد في الغابة.','جاء فأر صغير قربه.','أمسك الأسد بالفأر.','قال الفأر: سامحني.','تركه الأسد يذهب.','بعد أيام ساعد الفأر الأسد.','تعلم الأسد أن الصغير قد يساعد الكبير.']],
 ['الغراب والثعلب','🦊',['كان الغراب يحمل قطعة جبن.','رآه الثعلب وقال كلاماً جميلاً.','فتح الغراب فمه ليغني.','سقطت الجبنة.','أخذ الثعلب الجبنة.','تعلم الغراب ألا ينخدع بالكلام.']],
 ['البذرة الصغيرة','🌻',['وجد الطفل بذرة صغيرة.','وضعها في التراب.','سقاها كل يوم.','ظهرت ورقة خضراء.','كبرت النبتة بهدوء.','أصبحت زهرة جميلة.']],
 ['رحلة قطرة ماء','💧',['كانت قطرة ماء في السحابة.','نزلت مع المطر.','سقت شجرة صغيرة.','فرحت الشجرة كثيراً.','ذهبت القطرة إلى النهر.','قالت: أنا أحب الخير.']],
 ['الشجرة الكريمة','🌳',['كانت الشجرة كبيرة وجميلة.','جلس الأطفال في ظلها.','أعطتهم الشجرة ثماراً لذيذة.','شكر الأطفال الشجرة.','قالت الشجرة: أحب أن أساعدكم.']],
 ['السحابة والمطر','☁️',['كانت السحابة تمشي في السماء.','رأت الأرض عطشى.','أنزلت المطر بهدوء.','شربت الزهور والمزارع.','فرحت الأرض وقالت شكراً.']],
 ['النحلة والزهور','🐝',['طارت النحلة بين الزهور.','وقفت على زهرة صفراء.','أخذت قليلاً من الرحيق.','زارت زهرة أخرى.','قالت الزهور: أهلاً يا نحلة.']],
 ['الأرنب والجزرة','🥕',['خرج الأرنب يبحث عن طعام.','وجد جزرة برتقالية.','غسلها بالماء.','أكلها وهو سعيد.','قال: الطعام الصحي يجعلني قوياً.']],
 ['البطة الضائعة','🦆',['خرجت بطة صغيرة تلعب.','ابتعدت عن أمها.','سمعت صوت أمها من بعيد.','اتبعت الصوت بسرعة.','عادت إلى أمها بسلام.']],
 ['العصفور الصغير','🐦',['كان عصفور صغير يتعلم الطيران.','حاول مرة فسقط بهدوء.','حاول مرة أخرى.','رفرف بجناحيه.','طار فوق الشجرة وفرح.']],
 ['الشمس والزهرة','🌞',['طلعت الشمس في الصباح.','فتحت الزهرة أوراقها.','قالت الزهرة: صباح الخير.','أرسلت الشمس ضوءاً دافئاً.','كبرت الزهرة بسعادة.']],
 ['القمر والنجوم','🌙',['ظهر القمر في الليل.','لمعت النجوم حوله.','نظر الطفل إلى السماء.','قال: ما أجمل الليل الهادئ.','نام وهو سعيد.']],
 ['القطة والحليب','🐱',['رأت القطة كوب حليب.','اقتربت بهدوء.','شربت قليلاً من الحليب.','قالت: لذيذ جداً.','ثم نامت قرب النافذة.']],
 ['الكلب الوفي','🐶',['كان الكلب يحب صديقه.','مشى معه في الحديقة.','حرس حقيبته الصغيرة.','فرح الطفل بكلبه.','قال: أنت صديقي الوفي.']],
 ['الفيل والكرة','🐘',['وجد الفيل كرة ملونة.','دحرجها بخرطومه.','ضحكت الحيوانات.','لعبوا معاً.','قال الفيل: اللعب مع الأصدقاء أجمل.']],
 ['السمكة الصغيرة','🐟',['كانت سمكة صغيرة تسبح.','رأت فقاعات كثيرة.','لعبت قرب المرجان.','عادت إلى أمها.','قالت: البحر جميل.']],
 ['الدب والعسل','🐻',['شم الدب رائحة العسل.','مشى نحو الخلية بحذر.','أخذ قليلاً فقط.','شكر النحل من بعيد.','عاد سعيداً إلى بيته.']],
 ['الثعلب والعنب','🍇',['رأى الثعلب عنباً عالياً.','قفز مرة ومرتين.','لم يصل إليه.','مشى بعيداً بهدوء.','تعلم أن يحاول بطريقة أفضل.']],
 ['الدجاجة والقمح','🐔',['وجدت الدجاجة حبات قمح.','زرعتها في التراب.','سقتها بالماء.','كبر القمح.','صنعت خبزاً وشاركت أصدقاءها.']],
 ['القرد والموز','🐒',['رأى القرد موزة صفراء.','تسلق الشجرة بسرعة.','قطف الموزة.','قاسمها مع صديقه.','قال: المشاركة جميلة.']],
 ['الخروف النظيف','🐑',['اتسخ صوف الخروف بالطين.','ذهب ليستحم بالماء.','أصبح نظيفاً وجميلاً.','قالت أمه: النظافة رائعة.']],
 ['الجمل الصبور','🐫',['مشى الجمل في الصحراء.','كان الجو حاراً.','تابع الجمل بصبر.','وصل إلى الماء.','شرب وفرح كثيراً.']],
 ['الفراشة الجميلة','🦋',['خرجت فراشة ملونة.','طارت فوق الزهور.','وقفت على وردة حمراء.','رفرفت بجناحيها.','قال الطفل: ما أجملك.']],
 ['رحلة الورقة الخضراء','🍃',['كانت ورقة خضراء على الشجرة.','هب هواء خفيف.','طارت الورقة بهدوء.','سقطت قرب زهرة.','قالت: كانت رحلة لطيفة.']],
 ['التعاون قوة','🤝',['حاول طفل رفع صندوق.','كان الصندوق ثقيلاً.','جاء صديقه وساعده.','رفعا الصندوق معاً.','قالا: التعاون يجعل العمل سهلاً.']],
 ['المشاركة جميلة','🎁',['كان لدى ليلى تفاحة.','رأت أخاها يريد منها.','قسمت التفاحة نصفين.','أكلا معاً بفرح.','قال بدر: المشاركة جميلة.']],
 ['احترام الوالدين','👨‍👩‍👧',['نادته أمه بلطف.','رد الطفل: نعم يا أمي.','ساعد أباه في ترتيب الألعاب.','فرح الوالدان به.','قال بدر: الاحترام جميل.']]
];
function home(){layout(`<h2 class="title">اختر قسماً</h2><div class="grid">${sections.map(s=>`<button class="tile" onclick="section('${s.id}')"><div class="emoji">${s.emoji}</div><b>${s.title}</b><span>${s.hint}</span></button>`).join('')}<button class="tile" onclick="stories()"><div class="emoji">📖</div><b>القصص</b><span>30 قصة قصيرة مصورة</span></button><button class="tile" onclick="games()"><div class="emoji">🎮</div><b>الألعاب</b><span>لعب وتعلم</span></button><button class="tile" onclick="voicePanel()"><div class="emoji">🔊</div><b>تحسين النطق</b><span>اختيار صوت عربي أوضح</span></button></div>`,'home')}
function section(id){const sec=sections.find(x=>x.id===id); const arr=data[id]; layout(`<div class="row space"><button class="back" onclick="home()">رجوع</button><span class="chip">${arr.length} عنصر</span></div><h2 class="title">${sec.emoji} ${sec.title}</h2><div class="grid">${arr.map((it,i)=>`<button class="tile" onclick="item('${id}',${i})"><div class="emoji">${it[0]}</div><b>${it[1]}</b><span class="ltr">${it[2]||''}</span></button>`).join('')}</div>`)}
function item(id,i){const it=data[id][i]; const key=id+i; layout(`<div class="row space"><button class="back" onclick="section('${id}')">رجوع</button><span class="chip">⭐ ${state.stars}</span></div><div class="card"><div class="bigpic">${it[0]}</div><div class="wordAr">${it[1]}</div><div class="wordEn">${it[2]||it[1]}</div><div class="actions"><button class="btn" onclick="speak('${it[1]}','ar-JO');star('${key}')">🔊 عربي</button><button class="btn green" onclick="speak('${it[2]||it[1]}','en-US');star('${key}')">🔊 English</button><button class="btn sun" onclick="animalSound('${it[3]||it[2]||it[1]}')">🎵 صوت</button></div></div><div class="card center"><b>🐻 بدر يقول:</b><p class="muted">اضغط على أزرار الصوت وتعلم الكلمة بالعربية والإنجليزية.</p></div>`)}
function animalSound(t){ const sounds={moo:'موووو',woof:'هو هو',meow:'مياو',quack:'كواك كواك',roar:'رااار',baa:'بااا',neigh:'هييي',cluck:'كوكو',monkey:'أو أو آ آ',trumpet:'بووو'}; speak(sounds[t]||t,'ar-JO'); }
function stories(){layout(`<div class="row space"><h2 class="title">📖 القصص</h2><span class="chip">30 قصة</span></div><div class="list">${storiesList.map((s,i)=>`<button class="tile row" onclick="story(${i},0)"><div class="emoji">${s[1]}</div><div><b>${s[0]}</b><span>${s[2].length} صفحات قصيرة</span></div></button>`).join('')}</div>`,'stories')}
function story(i,p){const s=storiesList[i], pages=s[2], pct=Math.round(((p+1)/pages.length)*100); layout(`<div class="row space"><button class="back" onclick="stories()">القصص</button><span class="chip">${p+1} / ${pages.length}</span></div><div class="card"><div class="progress"><i style="width:${pct}%"></i></div><h2 class="center">${s[0]}</h2><div class="bigpic">${s[1]}</div><p class="storyText">${pages[p]}</p><div class="actions"><button class="btn" onclick="speak('${pages[p]}','ar-JO')">🔊 اسمع</button>${p>0?`<button class="btn alt" onclick="story(${i},${p-1})">السابق</button>`:''}${p<pages.length-1?`<button class="btn green" onclick="story(${i},${p+1})">التالي</button>`:`<button class="btn sun" onclick="finishStory(${i})">أنهيت القصة ⭐</button>`}</div></div>`,'stories')}
function finishStory(i){ if(!state.stories[i]){state.stories[i]=1;state.stars+=2;save()} toast('رائع! أنهيت القصة'); stories();}
function games(){layout(`<h2 class="title">🎮 الألعاب التعليمية</h2><div class="grid">
<button class="tile" onclick="quizPic()"><div class="emoji">👀</div><b>أين الصورة؟</b><span>أسئلة كثيرة ومتجددة</span></button>
<button class="tile" onclick="quizSound()"><div class="emoji">🔊</div><b>اسمع واختر</b><span>مطابقة الصوت والصورة</span></button>
<button class="tile" onclick="countGame()"><div class="emoji">🔢</div><b>عد الأشياء</b><span>من 1 إلى 10</span></button>
<button class="tile" onclick="bubbleLetters()"><div class="emoji">🎈</div><b>فقاعات الحروف</b><span>عربي وإنجليزي</span></button>
<button class="tile" onclick="englishPic()"><div class="emoji">🇬🇧</div><b>English Picture</b><span>اختر الصورة للكلمة الإنجليزية</span></button>
<button class="tile" onclick="colorGame()"><div class="emoji">🎨</div><b>لعبة الألوان</b><span>اختر اللون الصحيح</span></button>
<button class="tile" onclick="shapeGame()"><div class="emoji">🔺</div><b>لعبة الأشكال</b><span>اختر الشكل الصحيح</span></button>
<button class="tile" onclick="memoryGame()"><div class="emoji">🧠</div><b>ذاكرة الصور</b><span>اعثر على الزوج المتشابه</span></button>
</div>`,'games')}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]} function shuffle(a){return a.sort(()=>Math.random()-.5)}
function nextGame(kind){ if(kind==='pic') return quizPic(); if(kind==='sound') return quizSound(); if(kind==='count') return countGame(); if(kind==='letters') return bubbleLetters(); if(kind==='enpic') return englishPic(); if(kind==='color') return colorGame(); if(kind==='shape') return shapeGame(); if(kind==='memory') return memoryGame(); return quizPic(); }
function quizPic(){const pool=[...data.animals,...data.food,...data.transport]; const ans=pick(pool); const opts=shuffle([ans,...shuffle(pool.filter(x=>x!==ans)).slice(0,3)]); layout(`<div class="row space"><button class="back" onclick="games()">الألعاب</button><button class="btn small" onclick="quizPic()">سؤال جديد</button></div><h2 class="title">👀 أين ${ans[1]}؟</h2><div class="card center"><button class="btn" onclick="speak('أين ${ans[1]}؟','ar-JO')">🔊 اسمع السؤال</button>${opts.map(o=>`<button class="btn qopt" onclick="check(this,${o===ans},'pic')"><span style="font-size:48px">${o[0]}</span><br>${o[1]}</button>`).join('')}</div>`,'games')}
function quizSound(){const pool=[...data.animals,...data.food]; const ans=pick(pool); const opts=shuffle([ans,...shuffle(pool.filter(x=>x!==ans)).slice(0,3)]); layout(`<div class="row space"><button class="back" onclick="games()">الألعاب</button><button class="btn small" onclick="quizSound()">سؤال جديد</button></div><h2 class="title">🔊 اسمع واختر</h2><div class="card center"><button class="btn sun" onclick="speak('${ans[1]}','ar-JO')">تشغيل الصوت</button>${opts.map(o=>`<button class="btn qopt" onclick="check(this,${o===ans},'sound')"><span style="font-size:48px">${o[0]}</span><br>${o[1]}</button>`).join('')}</div>`,'games'); setTimeout(()=>speak(ans[1],'ar-JO'),400)}
function countGame(){const n=1+Math.floor(Math.random()*10), emoji=pick(['🍎','⭐','🐻','🚗','🍌']); const opts=shuffle([n, n+1, Math.max(1,n-1), n+2].filter((v,i,a)=>a.indexOf(v)===i)); layout(`<div class="row space"><button class="back" onclick="games()">الألعاب</button><button class="btn small" onclick="countGame()">سؤال جديد</button></div><h2 class="title">🔢 كم العدد؟</h2><div class="card center"><div style="font-size:42px;line-height:1.4">${emoji.repeat(n)}</div>${opts.map(o=>`<button class="btn qopt" onclick="check(this,${o===n},'count')">${o}</button>`).join('')}</div>`,'games')}
function bubbleLetters(){const letters=[...data.arabic.map(x=>x[1]),...data.english.map(x=>x[1])]; const ans=pick(letters); const opts=shuffle([ans,...shuffle(letters.filter(x=>x!==ans)).slice(0,5)]); layout(`<div class="row space"><button class="back" onclick="games()">الألعاب</button><button class="btn small" onclick="bubbleLetters()">سؤال جديد</button></div><h2 class="title">🎈 اضغط على حرف: ${ans}</h2><div class="grid">${opts.map(o=>`<button class="tile center" onclick="check(this,'${o}'==='${ans}','letters')"><div style="font-size:56px;font-weight:900">${o}</div></button>`).join('')}</div>`,'games')}


function englishPic(){const pool=[...data.animals,...data.food,...data.transport]; const ans=pick(pool); const opts=shuffle([ans,...shuffle(pool.filter(x=>x!==ans)).slice(0,3)]); layout(`<div class="row space"><button class="back" onclick="games()">الألعاب</button><button class="btn small" onclick="englishPic()">سؤال جديد</button></div><h2 class="title ltr">🇬🇧 ${ans[2]}</h2><div class="card center"><button class="btn green" onclick="speak('${ans[2]}','en-US')">🔊 English</button>${opts.map(o=>`<button class="btn qopt" onclick="check(this,${o===ans},'enpic')"><span style="font-size:48px">${o[0]}</span><br>${o[1]}</button>`).join('')}</div>`,'games'); setTimeout(()=>speak(ans[2],'en-US'),400)}
function colorGame(){const ans=pick(data.colors); const opts=shuffle([ans,...shuffle(data.colors.filter(x=>x!==ans)).slice(0,3)]); layout(`<div class="row space"><button class="back" onclick="games()">الألعاب</button><button class="btn small" onclick="colorGame()">سؤال جديد</button></div><h2 class="title">🎨 أين لون ${ans[1]}؟</h2><div class="card center"><button class="btn" onclick="speak('أين لون ${ans[1]}؟','ar-JO')">🔊 اسمع</button>${opts.map(o=>`<button class="btn qopt" onclick="check(this,${o===ans},'color')"><span style="font-size:58px">${o[0]}</span><br>${o[1]}</button>`).join('')}</div>`,'games')}
function shapeGame(){const ans=pick(data.shapes); const opts=shuffle([ans,...shuffle(data.shapes.filter(x=>x!==ans)).slice(0,3)]); layout(`<div class="row space"><button class="back" onclick="games()">الألعاب</button><button class="btn small" onclick="shapeGame()">سؤال جديد</button></div><h2 class="title">🔺 أين شكل ${ans[1]}؟</h2><div class="card center"><button class="btn" onclick="speak('أين شكل ${ans[1]}؟','ar-JO')">🔊 اسمع</button>${opts.map(o=>`<button class="btn qopt" onclick="check(this,${o===ans},'shape')"><span style="font-size:58px">${o[0]}</span><br>${o[1]}</button>`).join('')}</div>`,'games')}
let memFirst=null, memLock=false, memFound=0;
function memoryGame(){const base=shuffle([...data.animals,...data.food,...data.transport]).slice(0,4); const cards=shuffle([...base,...base].map((x,i)=>({x,i}))); memFirst=null; memLock=false; memFound=0; layout(`<div class="row space"><button class="back" onclick="games()">الألعاب</button><button class="btn small" onclick="memoryGame()">خلط جديد</button></div><h2 class="title">🧠 ذاكرة الصور</h2><div class="memoryGrid">${cards.map((c,i)=>`<button class="mem" data-key="${c.x[1]}" data-emoji="${c.x[0]}" onclick="memClick(this)">❔</button>`).join('')}</div><div class="card center"><p class="muted">اقلب بطاقتين، وابحث عن الصور المتشابهة.</p></div>`,'games')}
function memClick(btn){ if(memLock||btn.classList.contains('done')||btn===memFirst) return; btn.textContent=btn.dataset.emoji; btn.classList.add('open'); if(!memFirst){memFirst=btn; return;} memLock=true; if(memFirst.dataset.key===btn.dataset.key){btn.classList.add('done'); memFirst.classList.add('done'); memFirst=null; memLock=false; memFound++; speak('أحسنت','ar-JO'); if(memFound>=4){state.stars+=2;state.games++;save();toast('فزت في لعبة الذاكرة ⭐'); setTimeout(()=>memoryGame(),900);} }else{setTimeout(()=>{btn.textContent='❔';memFirst.textContent='❔';btn.classList.remove('open');memFirst.classList.remove('open');memFirst=null;memLock=false;},650)} }
function check(btn,ok,kind){
  document.querySelectorAll('.qopt,.tile').forEach(b=>b.disabled=true);
  btn.classList.add(ok?'good':'bad');
  if(ok){state.stars++; state.games++; save(); speak('أحسنت','ar-JO'); toast('إجابة صحيحة ⭐')}
  else {speak('حاول مرة أخرى','ar-JO');}
  const panel=document.createElement('div');
  panel.className='card center nextPanel';
  panel.innerHTML=`<button class="btn green" onclick="nextGame('${kind||'pic'}')">السؤال التالي ▶</button><button class="btn alt" onclick="games()">رجوع للألعاب</button>`;
  app.querySelector('.wrap').appendChild(panel);
}

function achievements(){const learned=Object.keys(state.learned).length, st=Object.keys(state.stories).length; layout(`<h2 class="title">⭐ إنجازاتي</h2><div class="grid"><div class="card center"><div class="stars">${state.stars}</div><b>نجمة</b></div><div class="card center"><div class="stars">${learned}</div><b>عنصر تعلمته</b></div><div class="card center"><div class="stars">${st}</div><b>قصة مكتملة</b></div><div class="card center"><div class="stars">${state.games}</div><b>لعبة صحيحة</b></div></div><div class="card center"><div class="bear" style="margin:auto">🐻</div><p><b>بدر فخور بك!</b></p><button class="btn alt" onclick="speak('بدر فخور بك، أحسنت يا بطل','ar-JO')">🔊 اسمع بدر</button></div>`,'ach')}
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
home();
