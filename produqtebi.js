import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  setPersistence, browserLocalPersistence  
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs,
  query, orderBy, serverTimestamp, where,
  deleteDoc, doc as firestoreDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAliuB2GqRm0s1U-2KuGVp6I0WThigGxPA",
  authDomain: "vmarchi29.github.io",
  projectId: "georgian-bites",
  storageBucket: "georgian-bites.firebasestorage.app",
  messagingSenderId: "485486300439",
  appId: "1:485486300439:web:21b211402b2e8be6e1bb52",
  measurementId: "G-XLVFZ8RWLP"
};

const app      = initializeApp(firebaseConfig);
const db       = getFirestore(app);
const auth     = getAuth(app);
auth.useDeviceLanguage(); 
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'  // ← ეს დაამატე
});
let currentUser = null;
let userFavs = [];

/* ══ მენიუ ══ */
/* ══ მენიუები კუზინის მიხედვით ══ */
const MENUS = {

  georgian: {
    'ხინკალი': [
      'ხინკალი მოხევური','ხინკალი ქალაქური','ხინკალი საქონლის',
      'ხინკალი სოკოთი','ხინკალი კარტოფილით','ხინკალი ყველით',
    ],
    'სალათები': [
      'საფირმო სალათა','სალათი ცეზარი','სალათი ცეზარი სიომგით',
      'სალათი კიტრი-პომიდორი','სალათი კიტრი-პომიდორი მაიონეზით',
      'სალათი კიტრი-პომიდორი ნიგვზით','სალათი ქამა სოკო მაიონეზით',
      'სალათი ქათმის','სალათი ბერძნული','სალათი ბოსტნეულის',
      'სალათა მწვანე','სალათა ოლივიე','სალათა ხორცის','სალათა კრაბის',
    ],
    'წვნიანები': [
      'თათარიახნი','ჩიხირთმა','სუპ-ხარჩო','სოკოს წვნიანი',
      'სოკოს კრემსუპი','პელმენის ბულიონი','ზბორნაია სალიანკა',
    ],
    'ცომეული': [
      'პიცა პეპერონი','პიცა მარგარიტა','პიცა ლორი და სოკო',
      'პიცა მექსიკური','პიცა ბერძნული','პიცა დელუქსი','პიცა ვეჯი',
      'პიცა 4 ყველის','პიცა კალიფსო','პიცა სამარხვო',
      'ხაჭაპური სამეფო','ხაჭაპური იმერული','ხაჭაპური მეგრული',
      'ხაჭაპური აჭარული','ხაჭაპური შამფურზე',
      'ლობიანი','ლობიანი აჭარული','ლობიანი ლორით','ლობიანი შამფურზე',
      'პური','მჭადი','ჭვიშტარი','კუბდარი','ქათმის ღვეზელი','სოკოს ღვეზელი','კარტოფილის ღვეზელი'
    ],
    'ცივი კერძები': [
      'ყველი იმერული','ყველი სულგუნი','ყველი შებოლილი სულგუნი',
      'ყველის ასორტი','მწნილის ასორტი','მჟავის ასორტი','ფხალის ასორტი',
      'ბადრიჯანი ნიგვზით','ბადრიჯანი ნივრით','ისპანახი ნიგვზით',
      'კუჭმაჭი ნიგვზით','ზეთის ხილი','საცივი','ბაჟე',
      'ნადუღი სულგუნის ფირფიტებში','ხბოს კანჭი მოხარშული',
      'მოხარშული ბურვაკი','დედალი მოხარშული','ლორის კანჭი',
    ],
    'ცხელი კერძები': [
      'ღორის კანჭი','ქათმის კერძი','ოსტრი','ხბოს ჩაშუშული',
      'ხბოს ჩაქაფული','ოჯახური ღორის ხორცით','ოჯახური ხბოს ხორცით',
      'წიწილა ტაბაკა','წიწილა ტყემალში','წიწილა შქმერულად',
      'წიწილა შქმერულად ქალაქური','ქათამი ფრანგულად',
      'სტეიკი ღორის ჩალაღაჯის','მწყერი შემწვარი',
      'ქათმის გულღვიძლი კეცზე','გოჭის ჯიგარი კეცზე',
      'ხბოს ჯიგარი კეცზე','ხბოს ნეკნები აჯიკით კეცზე',
      'ღორის ჯიგარი ბადექონში','მეგრული კუპატი გაშლილი კეცზე',
      'ლობიო ქოთანში','ლობიო ქოთანში მჟავით და მჭადით',
      'მადამ ბოვარი','მადამ ბოვარი სოკოთი','ხაშლამა',
      'ქამა სოკო კეცზე','ქამა სოკო კეცზე სულგუნით',
      'ქამა სოკო ჩაშუშული','ქამა სოკოს ოჯახური',
      'შემწვარი სულგუნი კეცზე','ღორის ნეკნები მოხარშული',
      'ტოლმა ვაზის ფოთოლში','ტოლმა კომბოსტოს ფოთოლში','ჟულიენი','ბიფსტროგანოვი',
      'კიევური კატლეტი გარნირით','ყალია ხბოს ხორცით',
      'სტეიკი ქათმის','სტეიკი საქონლის სუკის ღვინის სოუსში',
      'სტეიკი ღორის ჰოლანდიური ყველით',
      'კარტოფილი მექსიკურად','კარტოფილი ფრი',
      'კარტოფილი შქმერულად კეცზე','კარტოფილი ოჯახურად','პელმენი ქოთანში',
    ],
    'მაყალზე': [
      'საფირმო მწვადის ასორტი','საფირმო ქაბაბი გულუვეირი',
      'საფირმო ქაბაბი ყველით და გარნირით',
      'მწვადი ღორის','მწვადი ლორის ნეკნის','მწვადი სუკის',
      'მწვადი ჩალაჩაჭის','მწვადი ქათმის','ხბოს მწვადი კეცზე',
      'მწვადი ბოსტნეულის','ქაბაბის ასორტი','ქაბაბი',
      'ქაბაბი ქათმის','ქაბაბი ლულა',
      'იმერული კუპატი მაყალზე','აფხაზური მაყალზე',
    ],
    'თევზეული': [
      'საფირმო კალმახი ფოლგაში','კალმახი შემწვარი მაყალზე',
      'კალმახი შემწვარი','კალმახი ბროწეულის წვენში',
      'ბარაბულკა შემწვარი','ორაგული შემწვარი ნაშარაფით',
      'ორაგული ბაჟეში','ორაგული ქინძმარში',
      'შემწვარი კალმახი ნიგვზით და ბეკონით',
      'კალმახი კრაბის ჩხირებით','სიომგა შემწვარი შამფურზე',
      'სიომგის სტეიკი','ლოქო ქინძმარში','ლოქოს მწვადი',
    ],
    'სოუსები': [
      'ტყემალი','ტომატის საწებელი','კეჩუპი',
      'აჯიკა წითელი','აჯიკა მწვანე','მდოგვი',
      'მექსიკური სოუსი','ნაშარაფი','კარაქი',
      'მაიონეზი','არაჟანი','ბერძნული მაიონეზი',
    ],
    'დესერტი': [
      'კრეპი შოკოლადით და ბანანით','კრეპი ალუბლით და არაჟნით',
      'ხილის ასორტი',
      'მარწყვი დაშაქრული','ნაყინი','ტორტი',
      'მიწის თხილი','ბრაუნი','ბელგიური ვაფლი','ნაპოლეონი',
      'მერინგის რულეტი','შუ','ეკლერი','ნამცხვარი იდეალი','ნამცხვარი მედოკი',
      'ნამცხვარი ჩიტის რძე','ნამცხვარი ციყვი','ტარტალეტკა',
    ],
    'გამაგრილებელი სასმელები': [
      'გაზიანი გამაგრილებელი სასმელი','წყენი ხილის','რედბული',
      'კომპოტი','წყალი','ბორჯომი','ნაბეღლავი',
      'ცივი ყავა','ცივი ყავა ნაყინით','ცივი ჩაი',
    ],
    'ცხელი სასმელები': [
      'ყავა ესპრესო','ყავა ამერიკანო',
      'ყავა კაპუჩინო','ყავა ლატე','ყავა თურქული','ჩაი',
    ],
    'ლუდი ჩამოსასხმელი': ['არგო','სტელა','პერლცეი','გროლში','ჰოგარდენი'],
    'ლუდი ბოთლის': ['არგო','ჰაინეკენი','კარსტანგეირი','ფრანცისქანერი'],
    'ღვინო ჩამოსასხმელი': ['კახური','ქინძმარაული','საფერავი','ეროპული'],
    'ღვინო ბოთლის': [
      'თელიანი ველი ცოლიკაური','თელიანი ველი მანავის მწვანე',
      'თელიანი ველი თელური საფერავი','თელიანი ველი საფერავი',
      'თელიანი ველი ალაზ. ველი წითოლი','თელიანი ველი ალაზ. ველი თეთრი',
      'თელიანი ველი კახური N8','თელიანი ველი თელური ეროპული',
      'თელიანი ველი ქინძმარაული','თელიანი ველი წინანდალი',
      'თელიანი ველი ტვიში','თელიანი ველი მუკუზანი',
      'თელიანი ველი ხვანჭკარა',
      'ღვინო მარანი ქინძმარაული','ღვინო მარანი საფერავი',
      'ღვინო მარანი წინანდალი','ღვინო მარანი მუკუზანი',
      'ღვინო მარანი მწვანე','ღვინო მარანი ქვევრი საფერავი',
      'ღვინო მარანი ალაზნის ველი როზე','ღვინო მარანი ხვანჭკარა',
      'ღვინო მარანი რქაწითელი','ღვინო მარანი ტვიში',
      'ღვინო მარანი ქისი','ღვინო მარანი ცოლიკაური',
    ],
    'არაყი': [
      'ფინლანდია','აბსოლუტი','სტოლი ევროპული','ნემიროვი',
      'მედოფი','ხორტიცა','დანსკა','პარლამენტი',
      'გომი ლუქსი','ცელსი','გრეი გუსი','ბელუგა',
    ],
    'ჭაჭა': [
      'ჩამოსასხმელი ჭაჭა','თელიანი ველი ჭაჭა თეთრი',
      'თელიანი ველი ჭაჭა მუხის კასრში',
      'მარანი ჭაჭა კასრის','მარანი ჭაჭა საფერავი',
    ],
    'ვისკი / ტეკილა': [
      'ჩივას რეგალ','ჯონ ჯეიმსონი','ჯეკ დენიელსი',
      'ჯონი ვოლკ. რედ ლეიბელ','ჯიმ ბიმი','ბეილისი',
      'ტეკილა','მარტინი','სარაჯიშვილი',
    ],
    'კოქტეილები': [
      'კაიპირუსკა','კოსმოპოლიტანი','მაი თაი','მოჰიტო','ბლადი მერი (სისხლიანი მერი)','პინა კოლადა','ჰედნდრიქს ტონიკი','მარგარიტა',
      'ჯინჯერ მარგარიტა','მანქი ჯინჯერი','ბლუ ლაგუნა','ეფლ ჯეკი','ნეგრონი','ოლდ ფეშენი','ჯეიმს ბონდი','დრაი მარტინი','იაგერბული','კუბალიბრე',
      'ტეკილა სან რაიზი','ლონგ აილენდი','ლონგ აილენდი ენერჯი','ლონგ ენერგი','მილქ შეიქი',
    ],
  },

  burger: {
    'ბურგერები': [
      'ჰამბურგერი',
      'ჩისბურგერი',
      '2x ჰამბურგერი',
      '2x ჩისბურგერი',
      'საფირმო ბურგერი',
      'ბეკონ ბურგერი',
      'სოკოს ბურგერი',
      'ქათმის ბურგერი',
      'ვეჯი ბურგერი',
    ],
    'სნექები (მისაყოლებელი)': [
      'კარტოფილი ფრი',
      'ხახვის რგოლები',
      'ჩიკენ ნაგეტი',
    ],
    'სოუსები': [
      'კეჩუპი','მაიონეზი','მდოგვი',
      'ბარბექიუ','ჩედარის სოუსი',
      'მექსიკური სოუსი','ნაღების სოუსი',
    ],
    'სასმელები': [
      'კოკა-კოლა','ფანტა','სპრაიტი',
      'წყალი','ბორჯომი','ლიმონათი',
      'მილქ შეიქი შოკოლადის',
      'მილქ შეიქი ვანილის',
      'მილქ შეიქი მარწყვის',
    ],
  },

  shawarma: {
    'შაურმა': [
      'შაურმა ქათმის',
      'შაურმა ღორის',
      'შაურმა საქონლის',
      'შაურმა შერეული',
      'შაურმა ვეჯი',
      'დონერ ქებაბი',
      'ფალაფელი',
      'ვრაპი',
    ],
    'ბურგერები': [
      'ჰამბურგერი',
      'ჩისბურგერი',
      'ქათმის ბურგერი',
      'საფირმო ბურგერი',
    ],
    'გვერდითი კერძები': [
      'კარტოფილი ფრი',
      'ხახვის რგოლები',
    ],
    'სოუსები': [
      'კეჩუპი','მაიონეზი','მდოგვი',
      'ჰუმუსი','ტაჰინი',
      'მექსიკური სოუსი','ნივრის სოუსი',
      'ბარბექიუ',
    ],
    'სასმელები': [
      'კოკა-კოლა','ფანტა','სპრაიტი',
      'წყალი','ბორჯომი','ლიმონათი','რედბული',
    ],
  },

  asian: {
    'სუში': [
      'ფილადელფია როლი',
      'კალიფორნია როლი',
      'სპაისი ტუნა როლი',
      'სპაისი სალმონ როლი',
      'აგე ტამანეგი',
      'ტატაკი როლი',
      'ტემპურა როლი',
      'ვეჯი ტემპურა როლი',
      'ცეზარი როლი',
      'ცხელი ორაგულის როლი',
      'კრაბის როლი',
      'სიაკე მაკი',
      'იასაი მაკი',
      'დრაგონ როლი',
      'რეინბოუ როლი',
      'ავოკადო როლი',
      'კრევეტის ტემპურა როლი',
      'კატამარანი როლი',
      'ნიგირი ლოსოსის',
      'ნიგირი ტუნას',
      'ნიგირი კრევეტის',
      'საშიმი ლოსოსის',
      'საშიმი ტუნას',
      'ფუტომაკი',
      'ჰოსომაკი კუკუმბრით',
      'ავოკადო მაკი',
      'კრაბ მაკი',
      'კიტრის მაკი',
      'სუში გველთევზის',
      'სუში ორაგულით',
      'გუნკანი კრევეტით'
    ],
    'ატრია': [
      'ატრია ქათმით',
      'ატრია საქონლის ხორცით',
      'ატრია კრევეტით',
      'ატრია ბოსტნეულით (ვეჯი)',
      'ატრია ღორის ხორცით',
      'ატრია ზღვის პროდუქტებით',
    ],
    'წვნიანი': [
      'რამენი ქათმის ბულიონით',
      'რამენი ღორის ბულიონით',
      'მისო სუპი',
      'ფო ბო',
      'ტომ იამი',
      'ვონტონ წვნიანი',
    ],
    'სოუსები': [
      'სოიოს სოუსი',
      'ვასაბი',
      'ტერიაკის სოუსი',
      'ტკბილ-ცხარე სოუსი',
      'სეზამის სოუსი',
    ],
    'სასმელები': [
      'გაზიანი სასმელი',
      'წყალი',
    ],
  },

};

/* ═══ MENU — backward compat (georgian კუზინისთვის) ═══ */
const MENU = MENUS.georgian;
 
const CAT_ICON = {
  'ხინკალი':'🥟','სალათები':'🥗','წვნიანები':'🍲','ცომეული':'🧀',
  'ცივი კერძები':'🧊','ცხელი კერძები':'🍖','მაყალზე':'🍢',
  'თევზეული':'🐟','სოუსები':'🫙','დესერტი':'🍰',
  'გამაგრილებელი სასმელები':'🧃','ცხელი სასმელები':'☕',
  'ლუდი':'🍺','ღვინო':'🍷','არაყი / ჭაჭა':'🥃',
  'ვისკი / ტეკილა / ბრენდი':'🥃','კოქტეილები':'🍹',
};
 
/* ══ რესტორნები ══ */
const RESTAURANTS = [
  // ══ ქართული ══
  { id:1,  name:'ადორო',            nameEn:'Adoro',                icon:'❤️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Adoro+თბილისი' },
  { id:2,  name:'აზარფეშა',         nameEn:'Azarphesha',           icon:'🍷', cuisine:'georgian', maps:'https://www.google.com/maps/search/აზარფეშა+თბილისი' },
  { id:3,  name:'ალუბალი',          nameEn:'Alubali',              icon:'🍒', cuisine:'georgian', maps:'https://www.google.com/maps/search/ალუბალი+თბილისი' },
  { id:4,  name:'ამრა',             nameEn:'Amra',                 icon:'🌊', cuisine:'georgian', maps:'https://www.google.com/maps/search/Amra+თბილისი' },
  { id:5,  name:'აფიშა ბრასერი',    nameEn:'Afisha Brasserie',     icon:'🥂', cuisine:'georgian', maps:'https://www.google.com/maps/search/Afisha+Brasserie+თბილისი' },
  { id:6,  name:'არგო',             nameEn:'Argo Restaurant',      icon:'⚓', cuisine:'georgian', maps:'https://www.google.com/maps/search/Argo+Restaurant+თბილისი' },
  { id:7,  name:'ბარბარესთან',     nameEn:'Barbarestan',          icon:'🏛️', cuisine:'georgian', maps:'https://www.google.com/maps/search/ბარბარესტანი+თბილისი' },
  { id:8,  name:'ბერნარდი',         nameEn:'Bernard',              icon:'☕', cuisine:'georgian', maps:'https://www.google.com/maps/search/Bernard+თბილისი' },
  { id:9,  name:'ბრედ ჰაუსი',       nameEn:'Bread House',          icon:'🍞', cuisine:'georgian', maps:'https://www.google.com/maps/search/Bread+House+თბილისი' },
  { id:10, name:'გარდენ რესტორანი', nameEn:'Garden Restaurant',    icon:'🌿', cuisine:'georgian', maps:'https://www.google.com/maps/search/Garden+Restaurant+თბილისი' },
  { id:11, name:'გვიმრა',           nameEn:'Gvimra',               icon:'🍃', cuisine:'georgian', maps:'https://www.google.com/maps/search/გვიმრა+თბილისი'},
  { id:12, name:'გურმანია',         nameEn:'Gurmania',             icon:'👨‍🍳', cuisine:'georgian', maps:'https://www.google.com/maps/search/Gurmania+თბილისი' },
  { id:13, name:'დაფნა',            nameEn:'Daphna',               icon:'🌿', cuisine:'georgian', maps:'https://www.google.com/maps/search/Daphna+Restaurant+თბილისი' },
  { id:14, name:'დიზელი',           nameEn:'Dizel',                icon:'⚙️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Dizel+თბილისი' },
  { id:15, name:'დონ ჩიჩო',         nameEn:'Don Ciccio',           icon:'🍕', cuisine:'georgian', maps:'https://www.google.com/maps/search/Don+Ciccio+თბილისი' },
  { id:16, name:'დუნა',             nameEn:'Duna',                 icon:'🌊', cuisine:'georgian', maps:'https://www.google.com/maps/search/Duna+თბილისი'},
  { id:17, name:'ძველებური',        nameEn:'Dzveleburi',           icon:'🏛️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Dzveleburi+თბილისი' },
  { id:18, name:'ძველი სარდაფი',    nameEn:'Dzveli Sardapi',       icon:'🍷', cuisine:'georgian', maps:'https://www.google.com/maps/search/Dzveli+Sardapi+თბილისი' },
  { id:19, name:'ძველი უბანი',      nameEn:'Dzveli Ubani',         icon:'🏘️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Dzveli+Ubani+თბილისი' },
  { id:20, name:'ძველი ხიბულა',     nameEn:'Dzveli Khibula',       icon:'🏺', cuisine:'georgian', maps:'https://www.google.com/maps/search/Dzveli+Khibula+თბილისი' },
  { id:21, name:'ეთნო წისქვილი',    nameEn:'Ethno Tsiskvili',      icon:'🌾', cuisine:'georgian', maps:'https://www.google.com/maps/search/Ethno+Tsiskvili+თბილისი' },
  { id:22, name:'ეთნოგრაფი',        nameEn:'Ethnographer',         icon:'🎭', cuisine:'georgian', maps:'https://www.google.com/maps/search/Ethnographer+Restaurant+თბილისი' },
  { id:23, name:'ვან გოგი',         nameEn:'Van Goghi',            icon:'🎨', cuisine:'georgian', maps:'https://www.google.com/maps/search/Van+Goghi+თბილისი' },
  { id:24, name:'ვარაზი',           nameEn:'Varazi',               icon:'🐗', cuisine:'georgian', maps:'https://www.google.com/maps/search/Varazi+თბილისი' },
  { id:25, name:'ველიამინოვი',       nameEn:'Veliaminov',           icon:'🎖️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Veliaminov+თბილისი' },
  { id:26, name:'ვერიკო',           nameEn:'Veriko',               icon:'🌸', cuisine:'georgian', maps:'https://www.google.com/maps/search/Veriko+თბილისი' },
  { id:27, name:'ზალა',             nameEn:'Zala Restaurant',      icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Zala+Restaurant+თბილისი' },
  { id:28, name:'ზოდიაქო',          nameEn:'Zodiako',              icon:'⭐', cuisine:'georgian', maps:'https://www.google.com/maps/search/Zodiako+თბილისი' },
  { id:29, name:'თაღლაურა',         nameEn:'Taglaura',             icon:'🏔️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Taglaura+თბილისი' },
  { id:30, name:'თავადური',         nameEn:'Tavaduri',             icon:'👑', cuisine:'georgian', maps:'https://www.google.com/maps/search/Tavaduri+თბილისი' },
  { id:31, name:'თბილისური ეზო',    nameEn:'Tbilisuri Ezo',        icon:'🏡', cuisine:'georgian', maps:'https://www.google.com/maps/search/Tbilisuri+Ezo+თბილისი' },
  { id:32, name:'ტიფლისი',          nameEn:'Tiflisi Restaurant',   icon:'🗺️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Tiflisi+Restaurant+თბილისი' },
  { id:33, name:'იაკობის ეზო',      nameEn:'Iakobis Ezo',          icon:'🏡', cuisine:'georgian', maps:'https://www.google.com/maps/search/Iakobis+Ezo+თბილისი' },
  { id:34, name:'იასამანი',         nameEn:'Iasamani',             icon:'💜', cuisine:'georgian', maps:'https://www.google.com/maps/search/Iasamani+თბილისი' },
  { id:35, name:'კაკლები',          nameEn:'Kaklebi',              icon:'🌰', cuisine:'georgian', maps:'https://www.google.com/maps/search/Kaklebi+Restaurant+თბილისი' },
  { id:36, name:'კაფე ლეილა',       nameEn:'Cafe Leila',           icon:'🌙', cuisine:'georgian', maps:'https://www.google.com/maps/search/Cafe+Leila+თბილისი' },
  { id:37, name:'კახელები',         nameEn:'Kakhelebi',            icon:'🍇', cuisine:'georgian', maps:'https://www.google.com/maps/search/Kakhelebi+თბილისი' },
  { id:38, name:'კალანდა',          nameEn:'Kalanda',              icon:'🎶', cuisine:'georgian', maps:'https://www.google.com/maps/search/Kalanda+თბილისი' },
  { id:39, name:'ქეტო და კოტე',     nameEn:'Keto & Kote',          icon:'👫', cuisine:'georgian', maps:'https://www.google.com/maps/search/Keto+Kote+თბილისი' },
  { id:40, name:'კივი ვეგან კაფე',  nameEn:'Kiwi Vegan Cafe',      icon:'🥝', cuisine:'georgian', maps:'https://www.google.com/maps/search/Kiwi+Vegan+Cafe+თბილისი' },
  { id:41, name:'კლიკე',            nameEn:'Klike',                icon:'🥟', cuisine:'georgian', maps:'https://www.google.com/maps/search/Klike+თბილისი' },
  { id:42, name:'ლაგაზა',           nameEn:'Lagaza',               icon:'🍷', cuisine:'georgian', maps:'https://www.google.com/maps/search/Lagaza+Wine+Bar+თბილისი' },
  { id:43, name:'ლიტერა კაფე',      nameEn:'Cafe Littera',         icon:'📚', cuisine:'georgian', maps:'https://www.google.com/maps/search/Cafe+Littera+თბილისი' },
  { id:44, name:'ლინვილი',          nameEn:'Linville',             icon:'🌲', cuisine:'georgian', maps:'https://www.google.com/maps/search/Linville+თბილისი' },
  { id:45, name:'ლოლიტა',          nameEn:'Lolita',               icon:'🌺', cuisine:'georgian', maps:'https://www.google.com/maps/search/Lolita+თბილისი' },
  { id:46, name:'მასპინძელო',       nameEn:'Maspindzelo',          icon:'🏺', cuisine:'georgian', maps:'https://www.google.com/maps/search/Maspindzelo+თბილისი' },
  { id:47, name:'მაჭახელა',         nameEn:'Machakhela',           icon:'🏔️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Machakhela+თბილისი' },
  { id:48, name:'მაფშალია',         nameEn:'Mapshalia',            icon:'🎪', cuisine:'georgian', maps:'https://www.google.com/maps/search/Mapshalia+თბილისი' },
  { id:49, name:'მეტეხის ჩრდილი',  nameEn:'Metekhis Chrdili',     icon:'⛪', cuisine:'georgian', maps:'https://www.google.com/maps/search/Metekhis+Chrdili+თბილისი' },
  { id:50, name:'მრავალჟამიერი',    nameEn:'Mravaljamieri',        icon:'🎵', cuisine:'georgian', maps:'https://www.google.com/maps/search/Mravaljamieri+თბილისი' },
  { id:51, name:'ნინიას გარდენი',   nameEn:"Ninia's Garden",       icon:'🌷', cuisine:'georgian', maps:"https://www.google.com/maps/search/Ninia's+Garden+თბილისი" },
  { id:52, name:'ოლდ სიტი უოლი',   nameEn:'Old City Wall',        icon:'🏰', cuisine:'georgian', maps:'https://www.google.com/maps/search/Old+City+Wall+თბილისი' },
  { id:53, name:'ორგანიქ ჯოსპერ',  nameEn:'Organique Josper Bar', icon:'🌱', cuisine:'georgian', maps:'https://www.google.com/maps/search/Organique+Josper+Bar+თბილისი' },
  { id:54, name:'ოტსი',             nameEn:'Otsy',                 icon:'🎨', cuisine:'georgian', maps:'https://www.google.com/maps/search/Otsy+თბილისი' },
  { id:55, name:'პანორამა',         nameEn:'Panorama Restaurant',  icon:'🌅', cuisine:'georgian', maps:'https://www.google.com/maps/search/Panorama+Restaurant+თბილისი' },
  { id:56, name:'ფასანაური',        nameEn:'Pasanauri',            icon:'🥟', cuisine:'georgian', maps:'https://www.google.com/maps/search/Pasanauri+თბილისი' },
  { id:57, name:'პუბ 44',           nameEn:'Pub44',                icon:'🍺', cuisine:'georgian', maps:'https://www.google.com/maps/search/Pub44+თბილისი' },
  { id:58, name:'პური გულიანი',     nameEn:'Puri Guliani',         icon:'🫓', cuisine:'georgian', maps:'https://www.google.com/maps/search/Puri+Guliani+თბილისი' },
  { id:59, name:'რადიოკაფე',        nameEn:'RadioCafe',            icon:'📻', cuisine:'georgian', maps:'https://www.google.com/maps/search/RadioCafe+თბილისი' },
  { id:60, name:'რამეკაი',          nameEn:'Ramekai',              icon:'🍜', cuisine:'georgian', maps:'https://www.google.com/maps/search/Ramekai+თბილისი' },
  { id:61, name:'რეპუბლიკ 24',      nameEn:'Republic 24',          icon:'🏙️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Republic+24+თბილისი' },
  { id:62, name:'რეტრო',            nameEn:'Retro Restaurant',     icon:'🕰️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Retro+Restaurant+თბილისი' },
  { id:63, name:'რიგი',             nameEn:'Rigi',                 icon:'🌊', cuisine:'georgian', maps:'https://www.google.com/maps/search/Rigi+თბილისი' },
  { id:64, name:'საკუბდარე N1',     nameEn:'Sakubdare N1',         icon:'🥧', cuisine:'georgian', maps:'https://www.google.com/maps/search/Sakubdare+N1+თბილისი' },
  { id:65, name:'სალობიე ბია',      nameEn:'Salobie Bia',          icon:'🫘', cuisine:'georgian', maps:'https://www.google.com/maps/search/Salobie+Bia+თბილისი' },
  { id:66, name:'სამიკიტნო',        nameEn:'Samikitno',            icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Samikitno+თბილისი' },
  { id:67, name:'სასადილო ზეხე',    nameEn:'Sasadilo Zeche',       icon:'🕰️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Sasadilo+Zeche+თბილისი' },
  { id:68, name:'სახლი N11',        nameEn:'Sakhli #11',           icon:'🏠', cuisine:'georgian', maps:'https://www.google.com/maps/search/Sakhli+11+თბილისი' },
  { id:69, name:'სოლოლაკის კარი',  nameEn:'Sololakis Kari',       icon:'🚪', cuisine:'georgian', maps:'https://www.google.com/maps/search/Sololakis+Kari+თბილისი' },
  { id:70, name:'სომელ მელნიკოვას', nameEn:"Sofia Melnikova's",    icon:'🎭', cuisine:'georgian', maps:"https://www.google.com/maps/search/Sofia+Melnikova's+თბილისი" },
  { id:71, name:'სონეტი',           nameEn:'Sonnet Restaurant',    icon:'📜', cuisine:'georgian', maps:'https://www.google.com/maps/search/Sonnet+Restaurant+თბილისი' },
  { id:72, name:'სოფლის სახლი',     nameEn:'Soplis Sakhli',        icon:'🌾', cuisine:'georgian', maps:'https://www.google.com/maps/search/Soplis+Sakhli+თბილისი' },
  { id:73, name:'სორმონი',          nameEn:'Sormoni',              icon:'🏔️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Sormoni+თბილისი' },
  { id:74, name:'სტამბა',           nameEn:'Stamba Restaurant',    icon:'📰', cuisine:'georgian', maps:'https://www.google.com/maps/search/Stamba+Restaurant+თბილისი' },
  { id:75, name:'სულიკო',           nameEn:'Sulico',               icon:'🌹', cuisine:'georgian', maps:'https://www.google.com/maps/search/Sulico+თბილისი' },
  { id:76, name:'ტაბლა',            nameEn:'Tabla',                icon:'🥘', cuisine:'georgian', maps:'https://www.google.com/maps/search/Tabla+თბილისი' },
  { id:77, name:'ტიფანი ტერასა',    nameEn:'Tiffany Terrace',      icon:'💎', cuisine:'georgian', maps:'https://www.google.com/maps/search/Tiffany+Terrace+თბილისი' },
  { id:78, name:'ფერმენტი',         nameEn:'Ferment Wine Bistro',  icon:'🍾', cuisine:'georgian', maps:'https://www.google.com/maps/search/Ferment+Wine+Bistro+თბილისი' },
  { id:79, name:'ფუნიკულიორი',      nameEn:'Funicular Restaurant', icon:'🚡', cuisine:'georgian', maps:'https://www.google.com/maps/search/Funicular+Restaurant+თბილისი' },
  { id:80, name:'ქარება',           nameEn:'Khareba Winery',       icon:'🍇', cuisine:'georgian', maps:'https://www.google.com/maps/search/Khareba+Winery+Restaurant+თბილისი' },
  { id:81, name:'ქართველი სომელიე', nameEn:'Craft Wine Restaurant',icon:'🍷', cuisine:'georgian', maps:'https://www.google.com/maps/search/Craft+Wine+Restaurant+თბილისი' },
  { id:82, name:'შავი ლომი',        nameEn:'Shavi Lomi',           icon:'🦁', cuisine:'georgian', maps:'https://www.google.com/maps/search/Shavi+Lomi+თბილისი' },
  { id:83, name:'შემომეჭამა',       nameEn:'Shemomechama',         icon:'😋', cuisine:'georgian', maps:'https://www.google.com/maps/search/Shemomechama+თბილისი' },
  { id:84, name:'წისქვილი',         nameEn:'Tsiskvili',            icon:'🌾', cuisine:'georgian', maps:'https://www.google.com/maps/search/Tsiskvili+თბილისი' },
  { id:85, name:'ჩვენი',            nameEn:'Chveni',               icon:'🏠', cuisine:'georgian', maps:'https://www.google.com/maps/search/Chveni+თბილისი' },
  { id:86, name:'შეფ სარაჯიშვილი', nameEn:'Chef Saradjeff',       icon:'👨‍🍳', cuisine:'georgian', maps:'https://www.google.com/maps/search/Chef+Saradjeff+თბილისი' },
  { id:87, name:'ხედი',             nameEn:'Khedi',                icon:'🌅', cuisine:'georgian', maps:'https://www.google.com/maps/search/Khedi+Restaurant+თბილისი' },
  { id:88, name:'ხემე',             nameEn:'Xeme Restaurant',      icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Xeme+Restaurant+თბილისი' },
  { id:89, name:'ხინკლის სახლი',    nameEn:'Khinkali House',       icon:'🥟', cuisine:'georgian', maps:'https://www.google.com/maps/search/Khinkali+House+თბილისი' },
  { id:90, name:'ჯეო ჰაუსი',       nameEn:'Georgian House',       icon:'🇬🇪', cuisine:'georgian', maps:'https://www.google.com/maps/search/Georgian+House+თბილისი' },
  { id:102, name:'მადარტი',            nameEn:'Madarti',                icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Madarti+თბილისი' },
  { id:103, name:'ალექსანდრია',        nameEn:'Alexandria',             icon:'🏛️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Alexandria+Restaurant+თბილისი' },
  { id:104, name:'ოსური ხაჭაპურის სახლი', nameEn:'Osuri Khachapuri House', icon:'🧀', cuisine:'georgian', maps:'https://www.google.com/maps/search/Osuri+Khachapuri+House+თბილისი' },
  { id:106, name:'Bback Restaurant',   nameEn:'Bback Restaurant',       icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Bback+Restaurant+თბილისი' },
  { id:109, name:'რონის პიცა',         nameEn:"Roni's Pizza",           icon:'🍕', cuisine:'georgian', maps:'https://www.google.com/maps/search/Ronis+Pizza+თბილისი' },
  { id:110, name:'რესტორანი ალილო',    nameEn:'Alilo Restaurant',       icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Alilo+Restaurant+თბილისი' },
  { id:111, name:'ხინკლის კუთხე',      nameEn:'Khinkali Corner',        icon:'🥟', cuisine:'georgian', maps:'https://www.google.com/maps/search/Khinkali+Corner+თბილისი' },
  { id:112, name:'რესტორანი ბალადა',   nameEn:'Balada Restaurant',      icon:'🎵', cuisine:'georgian', maps:'https://www.google.com/maps/search/Balada+Restaurant+თბილისი' },
  { id:113, name:'მეინახე',            nameEn:'Meinakhe',               icon:'🍷', cuisine:'georgian', maps:'https://www.google.com/maps/search/Meinakhe+თბილისი' },
  { id:115, name:'რესტორანი ბრილიანტი', nameEn:'Brilliant Restaurant',  icon:'💎', cuisine:'georgian', maps:'https://www.google.com/maps/search/Brilliant+Restaurant+თბილისი' },
  { id:118, name:'რესტორანი გასტროლოფტი', nameEn:'Gastroloft',         icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Gastroloft+თბილისი' },
  { id:119, name:'საჩინო',             nameEn:'Sachino',                icon:'🏺', cuisine:'georgian', maps:'https://www.google.com/maps/search/Sachino+თბილისი' },
  { id:120, name:'ლუდის მოედანი',      nameEn:'Beer Square',            icon:'🍺', cuisine:'georgian', maps:'https://www.google.com/maps/search/Beer+Square+თბილისი' },
  { id:121, name:'საჭაშნიკე',          nameEn:'Sachashnike',            icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Sachashnike+თბილისი' },
  { id:127, name:'რესტორანი გივის დუქანი', nameEn:'Givis Dukani',      icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Givis+Dukani+თბილისი' },
  { id:128, name:'რესტორანი ბაბილო',   nameEn:'Babilo Restaurant',      icon:'🏺', cuisine:'georgian', maps:'https://www.google.com/maps/search/Babilo+Restaurant+თბილისი' },
  { id:129, name:'კარაველა',           nameEn:'Karavela',               icon:'⚓', cuisine:'georgian', maps:'https://www.google.com/maps/search/Karavela+თბილისი' },
  { id:132, name:'რესტორანი ქართლი',   nameEn:'Kartli Restaurant',      icon:'🏔️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Kartli+Restaurant+თბილისი' },
  { id:133, name:'თიშები',             nameEn:'Tishebi',                icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Tishebi+თბილისი' },
  { id:134, name:'იმპერიალი',          nameEn:'Imperial',               icon:'👑', cuisine:'georgian', maps:'https://www.google.com/maps/search/Imperial+Restaurant+თბილისი' },
  { id:135, name:'რესტორანი მეგობრები', nameEn:'Megobrebi Restaurant',  icon:'👫', cuisine:'georgian', maps:'https://www.google.com/maps/search/Megobrebi+Restaurant+თბილისი' },
  { id:137, name:'ოჩამჩირე',           nameEn:'Ochamchire',             icon:'🌊', cuisine:'georgian', maps:'https://www.google.com/maps/search/Ochamchire+Restaurant+თბილისი' },
  { id:140, name:'მონოპოლი',           nameEn:'Monopoly',               icon:'🎲', cuisine:'georgian', maps:'https://www.google.com/maps/search/Monopoly+Restaurant+თბილისი' },
  { id:141, name:'სლავური ეზო',        nameEn:'Slavic House',           icon:'🏡', cuisine:'georgian', maps:'https://www.google.com/maps/search/Slavic+House+თბილისი' },
  { id:142, name:'რესტორანი თბილისი',  nameEn:'Tbilisi Restaurant',     icon:'🗺️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Tbilisi+Restaurant+თბილისი' },
  { id:143, name:'ჰელმეტარიუმი',       nameEn:'Helmetarium',            icon:'🪖', cuisine:'georgian', maps:'https://www.google.com/maps/search/Helmetarium+თბილისი' },
  { id:144, name:'ოდა',                nameEn:'Oda Restaurant',         icon:'🏺', cuisine:'georgian', maps:'https://www.google.com/maps/search/Oda+Restaurant+თბილისი' },
  { id:145, name:'რესტორანი ბერმუხა',  nameEn:'Bermukha',               icon:'🌿', cuisine:'georgian', maps:'https://www.google.com/maps/search/Bermukha+თბილისი' },
  { id:146, name:'მუხიანის კანჭი',     nameEn:'Mukhianis Kanchi',       icon:'🍖', cuisine:'georgian', maps:'https://www.google.com/maps/search/Mukhianis+Kanchi+თბილისი' },
  { id:148, name:'მეგრული ოდა',        nameEn:'Megruli Oda',            icon:'🏺', cuisine:'georgian', maps:'https://www.google.com/maps/search/Megruli+Oda+თბილისი' },
  { id:149, name:'ჩემო კარგო',         nameEn:'Chemo Kargo',            icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Chemo+Kargo+თბილისი' },
  { id:150, name:'პელაგონი',           nameEn:'Pelagoni',               icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Pelagoni+თბილისი' },
  { id:152, name:'ურმული',             nameEn:'Urmuli',                 icon:'🛻', cuisine:'georgian', maps:'https://www.google.com/maps/search/Urmuli+თბილისი' },
  { id:153, name:'თავლა',              nameEn:'Tavla',                  icon:'♟️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Tavla+Restaurant+თბილისი' },
  { id:154, name:'ამბრა',             nameEn:'Ambra',                  icon:'🌊', cuisine:'georgian', maps:'https://www.google.com/maps/search/Ambra+Restaurant+თბილისი' },
  { id:155, name:'შინო',               nameEn:'Shino',                  icon:'🏠', cuisine:'georgian', maps:'https://www.google.com/maps/search/Shino+თბილისი' },
  { id:156, name:'მაყაშვილებთან',      nameEn:'Makashvilebthan',        icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Makashvilebthan+თბილისი' },
  { id:157, name:'რესტორანი ეთნოსი',   nameEn:'Ethnosi Restaurant',     icon:'🎭', cuisine:'georgian', maps:'https://www.google.com/maps/search/Ethnosi+Restaurant+თბილისი' },
  { id:158, name:'2 ტონა',             nameEn:'2 Tona',                 icon:'⚓', cuisine:'georgian', maps:'https://www.google.com/maps/search/2+Tona+თბილისი' },
  { id:163, name:'HB სამეფო',          nameEn:'HB Samepo',              icon:'👑', cuisine:'georgian', maps:'https://www.google.com/maps/search/HB+Samepo+თბილისი' },
  { id:164, name:'ფასანაური',          nameEn:'Fasanauri',              icon:'🏔️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Fasanauri+Restaurant+თბილისი' },
  { id:165, name:'შუა ქალაქი',         nameEn:'Shua Kalaki',            icon:'🏙️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Shua+Kalaki+თბილისი' },
  { id:166, name:'გრილ მორი',          nameEn:'Grill Mori',             icon:'🔥', cuisine:'georgian', maps:'https://www.google.com/maps/search/Grill+Mori+თბილისი' },
  { id:167, name:'შინაურა',            nameEn:'Shinaura',               icon:'🏠', cuisine:'georgian', maps:'https://www.google.com/maps/search/Shinaura+თბილისი' },
  { id:168, name:'ბეღელი',             nameEn:'Begheli',                icon:'🌾', cuisine:'georgian', maps:'https://www.google.com/maps/search/Begheli+თბილისი' },
  { id:169, name:'ოტიუმი',             nameEn:'Otium',                  icon:'🍷', cuisine:'georgian', maps:'https://www.google.com/maps/search/Otium+თბილისი' },
  { id:170, name:'ბრეტონ',             nameEn:'Breton',                 icon:'🥐', cuisine:'georgian', maps:'https://www.google.com/maps/search/Breton+თბილისი' },
  { id:171, name:'ალფრედო',            nameEn:'Alfredo',                icon:'🍝', cuisine:'georgian', maps:'https://www.google.com/maps/search/Alfredo+თბილისი' },
  { id:173, name:'მადრე',              nameEn:'Madre',                  icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Madre+თბილისი' },
  { id:174, name:'12 თაღი',            nameEn:'12 Taghi',               icon:'🏛️', cuisine:'georgian', maps:'https://www.google.com/maps/search/12+Taghi+თბილისი' },
  { id:175, name:'გრაფიკა',            nameEn:'Grafika',                icon:'🎨', cuisine:'georgian', maps:'https://www.google.com/maps/search/Grafika+Restaurant+თბილისი' },
  { id:176, name:'Khinkali Bar 11',    nameEn:'Khinkali Bar 11',        icon:'🥟', cuisine:'georgian', maps:'https://www.google.com/maps/search/Khinkali+Bar+11+თბილისი' },
  { id:177, name:'Tanini',             nameEn:'Tanini',                 icon:'🍷', cuisine:'georgian', maps:'https://www.google.com/maps/search/Tanini+თბილისი' },
  { id:178, name:'Shatre',             nameEn:'Shatre',                 icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Shatre+თბილისი' },
  { id:179, name:'Grand Cafe',         nameEn:'Grand Cafe',             icon:'☕', cuisine:'georgian', maps:'https://www.google.com/maps/search/Grand+Cafe+თბილისი' },
  { id:180, name:'The Grill',          nameEn:'The Grill',              icon:'🔥', cuisine:'georgian', maps:'https://www.google.com/maps/search/The+Grill+თბილისი' },
  { id:181, name:'Strada',             nameEn:'Strada',                 icon:'🍝', cuisine:'georgian', maps:'https://www.google.com/maps/search/Strada+თბილისი' },
  { id:182, name:'Slinki Kafe',        nameEn:'Slinki Kafe',            icon:'☕', cuisine:'georgian', maps:'https://www.google.com/maps/search/Slinki+Kafe+თბილისი' },
  { id:183, name:'ძველი დრო',          nameEn:'Dzveli Dro',             icon:'🕰️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Dzveli+Dro+თბილისი' },
  { id:184, name:'პალმები',            nameEn:'Palmebi',                icon:'🌴', cuisine:'georgian', maps:'https://www.google.com/maps/search/Palmebi+თბილისი' },
  { id:185, name:'სახინკლე ცეხში',     nameEn:'Sakhinkle Tsekshi',      icon:'🥟', cuisine:'georgian', maps:'https://www.google.com/maps/search/Sakhinkle+Tsekshi+თბილისი' },
  { id:186, name:'ჭური',               nameEn:'Churi',                  icon:'🏺', cuisine:'georgian', maps:'https://www.google.com/maps/search/Churi+Restaurant+თბილისი' },
  { id:187, name:'ირისი ვერანდა',      nameEn:'Irisi Veranda',          icon:'🌸', cuisine:'georgian', maps:'https://www.google.com/maps/search/Irisi+Veranda+თბილისი' },
  { id:188, name:'Terrace Botanica',   nameEn:'Terrace Botanica',       icon:'🌿', cuisine:'georgian', maps:'https://www.google.com/maps/search/Terrace+Botanica+თბილისი' },
  { id:191, name:'ცაზე',               nameEn:'Tsaze',                  icon:'☁️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Tsaze+Restaurant+თბილისი' },
  { id:192, name:'კრწანისი',           nameEn:'Krtsanisi',              icon:'🏰', cuisine:'georgian', maps:'https://www.google.com/maps/search/Krtsanisi+Restaurant+თბილისი' },
  { id:193, name:'რესტორანი ორთაჭალა', nameEn:'Ortachala Restaurant',   icon:'🌊', cuisine:'georgian', maps:'https://www.google.com/maps/search/Ortachala+Restaurant+თბილისი' },
  { id:194, name:'მარილი',             nameEn:'Marili',                 icon:'🧂', cuisine:'georgian', maps:'https://www.google.com/maps/search/Marili+Restaurant+თბილისი' },
  { id:195, name:'სამი საუკუნე',       nameEn:'Three Centuries',        icon:'⏳', cuisine:'georgian', maps:'https://www.google.com/maps/search/Three+Centuries+თბილისი' },
  { id:196, name:'რივერ ჰოლი',         nameEn:'River Hall',             icon:'🌊', cuisine:'georgian', maps:'https://www.google.com/maps/search/River+Hall+თბილისი' },
  { id:197, name:'სენსაცია',           nameEn:'Sensation',              icon:'✨', cuisine:'georgian', maps:'https://www.google.com/maps/search/Sensation+Restaurant+თბილისი' },
  { id:199, name:'ბიერნესტი',          nameEn:'Biernesti',              icon:'🍺', cuisine:'georgian', maps:'https://www.google.com/maps/search/Biernesti+თბილისი' },
  { id:201, name:'რესტორანი პლატფორმა', nameEn:'Platform Restaurant',  icon:'🏙️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Platform+Restaurant+თბილისი' },
  { id:202, name:'სოული',              nameEn:'Souli',                  icon:'🎵', cuisine:'georgian', maps:'https://www.google.com/maps/search/Souli+Restaurant+თბილისი' },
  { id:203, name:'სამიდიე',            nameEn:'Samidie',                icon:'🍽️', cuisine:'georgian', maps:'https://www.google.com/maps/search/Samidie+თბილისი' },
  { id:204, name:'ფიროსმანის დუქანი',  nameEn:'Pirosmanis Dukani',      icon:'🎨', cuisine:'georgian', maps:'https://www.google.com/maps/search/Pirosmanis+Dukani+თბილისი' },
  { id:205, name:'პასტა მანია',        nameEn:'Pasta Mania',            icon:'🍝', cuisine:'georgian', maps:'https://www.google.com/maps/search/Pasta+Mania+თბილისი' },
  { id:207, name:'ტერემოკი',           nameEn:'Teremok',                icon:'🥞', cuisine:'georgian', maps:'https://www.google.com/maps/search/Teremok+თბილისი' },
  { id:290, name:'ბიკენტიას საქაბაბე',           nameEn:'bikentias sakababe',                icon:'🥞', cuisine:'georgian', maps:'https://www.google.com/maps/place/Bykentia+Sakababe/@41.7285423,44.7803046,17z/data=!3m1!4b1!4m6!3m5!1s0x404473a71a736d03:0x8ca5cb6131270df3!8m2!3d41.7285423!4d44.7828795!16s%2Fg%2F11pdmdd2rq?entry=ttu&g_ep=EgoyMDI2MDMxOC4xIKXMDSoASAFQAw%3D%3D' },


  // ══ ბურგერები ══
  { id:91,  name:'ბურგერ ჰაუსი',      nameEn:'Burger House',           icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Burger+House+თბილისი' },
  { id:92,  name:'სმეშ ბარი',          nameEn:'Smash Bar',              icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Smash+Bar+თბილისი' },
  { id:93,  name:'ბიგ ბოი ბურგერი',   nameEn:'Big Boy Burger',         icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Big+Boy+Burger+თბილისი' },
  { id:94,  name:'კრისპი',             nameEn:'Crispy Burgers',         icon:'🍟', cuisine:'burger', maps:'https://www.google.com/maps/search/Crispy+თბილისი'},
  { id:101, name:'ბურგერ ლაიონი',     nameEn:'Burger Lion',            icon:'🦁', cuisine:'burger', maps:'https://www.google.com/maps/search/Burger+Lion+თბილისი', 
    extraDishes:{'ბურგერები':['ასტერიქსი','ობელიქსი','გლადიატორი','ლომის ღრიალი','იულიუსი','სტეიკ ბურგერი','ასტეროიდი','ხუთი ყველის ბურგერი','დრუიდი','ევერესტი','სმეშ ბურგერი','ზევსი','სფინქსი',
      'ბიგ მაქსი','ჰალაპენიო ბურგერი','თეთრი ლომი','იდეაფიქს პლიუსი']} },
  { id:138, name:'მაკდონალდსი',        nameEn:"McDonald's",             icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/McDonalds+თბილისი' },
  { id:139, name:'ვენდი',              nameEn:"Wendy's",                icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Wendys+თბილისი' },
  { id:200, name:'ალ ბაიკი',           nameEn:'Al Baik',                icon:'🍗', cuisine:'burger', maps:'https://www.google.com/maps/search/Al+Baik+თბილისი' },
  { id:266, name:'7G Seven G',           nameEn:'7G Seven G',           icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/7G+Seven+G+თბილისი' },
  { id:267, name:'KFC',                  nameEn:'KFC',                  icon:'🍗', cuisine:'burger', maps:'https://www.google.com/maps/search/KFC+თბილისი' },
  { id:268, name:'BBQ Hub',              nameEn:'BBQ Hub',              icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/BBQ+Hub+თბილისი' },
  { id:269, name:'XL Burgers',           nameEn:'XL Burgers',           icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/XL+Burgers+თბილისი' },
  { id:270, name:'Gochits',              nameEn:'Gochits',              icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Gochits+თბილისი' },
  { id:271, name:'Burger',               nameEn:'Burger',               icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Burger+Restaurant+თბილისი' },
  { id:272, name:'The Union',            nameEn:'The Union',            icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/The+Union+თბილისი' },
  { id:273, name:'Burger King',          nameEn:'Burger King',          icon:'👑', cuisine:'burger', maps:'https://www.google.com/maps/search/Burger+King+თბილისი' },
  { id:274, name:'Cafe Room',            nameEn:'Cafe Room',            icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Cafe+Room+თბილისი' },
  { id:275, name:'Hot-Dog Room',         nameEn:'Hot-Dog Room',         icon:'🌭', cuisine:'burger', maps:'https://www.google.com/maps/search/Hot-Dog+Room+თბილისი' },
  { id:276, name:'Los Amigos',           nameEn:'Los Amigos',           icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Los+Amigos+თბილისი' },
  { id:277, name:'Radio Diner',          nameEn:'Radio Diner',          icon:'📻', cuisine:'burger', maps:'https://www.google.com/maps/search/Radio+Diner+თბილისი' },
  { id:278, name:'რუდის ბურგერი',        nameEn:'Rudi\'s Burger',       icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Rudis+Burger+თბილისი' },
  { id:279, name:'Christia Restaurant',  nameEn:'Christia Restaurant',  icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Christia+Restaurant+თბილისი' },
  { id:280, name:'Shark',                nameEn:'Shark',                icon:'🦈', cuisine:'burger', maps:'https://www.google.com/maps/search/Shark+Restaurant+თბილისი' },
  { id:281, name:'4 Brothers',           nameEn:'4 Brothers',           icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/4+Brothers+თბილისი' },
  { id:282, name:'4 გაიზ ბურგერ გლდანი', nameEn:'4 Guys Burger Gldani', icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/4+Guys+Burger+Gldani+თბილისი' },
  { id:284, name:'Cafe Sorelle',         nameEn:'Cafe Sorelle',         icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Cafe+Sorelle+თბილისი' },
  { id:285, name:'ბურგერ ინ პეტრიწი',   nameEn:'Burger In Petrici',    icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Burger+In+Petrici+თბილისი' },
  { id:286, name:'Sport Cafe',           nameEn:'Sport Cafe',           icon:'⚽', cuisine:'burger', maps:'https://www.google.com/maps/search/Sport+Cafe+თბილისი' },
  { id:287, name:'პანორამა ბუფეტი',      nameEn:'Panorama Buffet',      icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Panorama+Buffet+თბილისი' },
  { id:288, name:'Rumman',               nameEn:'Rumman',               icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Rumman+თბილისი' },
  { id:289, name:'Burger Bar',           nameEn:'Burger Bar',           icon:'🍔', cuisine:'burger', maps:'https://www.google.com/maps/search/Burger+Bar+თბილისი' },
  // ══ შაურმა ══
  { id:95,  name:'შაურმა კინგი',       nameEn:'Shawarma King',          icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Shawarma+King+თბილისი' },
  { id:96,  name:'დონერ პალასი',       nameEn:'Doner Palace',           icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Doner+Palace+თბილისი' },
  { id:97,  name:'სტრიტ შეფი',         nameEn:'Street Chef',            icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Street+Chef+თბილისი' },
  { id:105, name:'ტიფლისი შაურმა',     nameEn:'Tiflisi Shawarma',       icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Tiflisi+Shawarma+თბილისი' },
  { id:107, name:'შაურუმი',            nameEn:'Shaurumi',               icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Shaurumi+თბილისი' },
  { id:108, name:'კრაფტ ფუდი',         nameEn:'Craft Food',             icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Craft+Food+თბილისი' },
  { id:116, name:'შაურმანიაკი',        nameEn:'Shaurmaniac',            icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Shaurmaniac+თბილისი' },
  { id:117, name:'შაურმა ქლაბი',       nameEn:'Shawarma Club',          icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Shawarma+Club+თბილისი' },
  { id:122, name:'გლდანის შაურმა',     nameEn:'Gldani Shawarma',        icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Gldani+Shawarma+თბილისი' },
  { id:123, name:'მაკშაურმა',          nameEn:'Mak Shawarma',           icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Mak+Shawarma+თბილისი' },
  { id:124, name:'ბალუს შაურმა',       nameEn:'Balu Shawarma',          icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Balu+Shawarma+თბილისი' },
  { id:125, name:'მარგეს შაურმა',      nameEn:'Marge Shawarma',         icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Marge+Shawarma+თბილისი' },
  { id:126, name:'Oldenburg',   nameEn:'Oldenburg',     icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Oldenburg+Shawarma+თბილისი' },
  { id:130, name:'შაურმა მადლიანი',    nameEn:'Madliani Shawarma',      icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Madliani+Shawarma+თბილისი' },
  { id:136, name:"Gote's Shawarma",    nameEn:"Gote's Shawarma",        icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Gotes+Shawarma+თბილისი' },
  { id:151, name:'ქუთეს შაურმა',       nameEn:'Kute Shawarma',          icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Kute+Shawarma+თბილისი' },
  { id:159, name:'New Istanbul',       nameEn:'New Istanbul',           icon:'🌙', cuisine:'shawarma', maps:'https://www.google.com/maps/search/New+Istanbul+თბილისი' },
  { id:189, name:'Elita Shawarma',     nameEn:'Elita Shawarma',         icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Elita+Shawarma+თბილისი' },
  { id:198, name:'შაურმაფია',          nameEn:'Shawarmaphia',           icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Shawarmaphia+თბილისი' },
  { id:210, name:'სოულ შაურმა',        nameEn:'Soul Shawarma',          icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Soul+Shawarma+თბილისი' },
  { id:208, name:'ვრაპ მასტერი',        nameEn:'Wrap Master',            icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Wrap+Master+თბილისი',
  extraDishes:{'შაურმა':['კლასიკური ქათმის ვრაპი','კლასიკური საქონლის ვრაპი','ტრუფელი ქათმის ვრაპი','მექსიკური ქათმის ვრაპი','ნაჩოს ქათმის ვრაპი ცხარე','არაჟნის ქათმის ვრაპი','ნაჩოს საქონლის ვრაპი','ლურჯი ყველის ქათმის ვრაპი','კოულ სლოუ ქათმის ვრაპი','აჯიკა ქათმის ვრაპი ცხარე','რიო ქათმის ვრაპი','ლურჯი ყველის საქონლის ვრაპი','მაკ ქათმის ვრაპი','ტერიაკი ქათმის ვრაპი','სრირაჩა ქათმის ვრაპი ცხარე','კარი ქათმის ვრაპი ცხარე','ბარბექიუს ქათმის ვრაპი','აჯიკა ვეგეტარიანული ვრაპი ცხარე','ტერიაკი ვეგეტარიანული ვრაპი ცხარე','კოულ სლოუ ვეგეტარიანული ვრაპი ცხარე','კარი ვეგეტარიანული ვრაპი ცხარე','მექსიკური ვეგეტარიანული ვრაპი ცხარე','ტრუფელი ვეგეტარიანული ვრაპი ცხარე','ნაჩოს ვეგეტარიანული ვრაპი','ლურჯი ყველის ვეგეტარიანული ვრაპი','კლასიკური ვეგეტარიანული ვრაპი']}},
  { id:241, name:'შონზოს შაურმა',        nameEn:'Shonzo\'s Shawarma',        icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Shonzos+Shawarma+თბილისი' },
  { id:242, name:'შაშაურმე',                  nameEn:'Shashaurme',                icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Shashaurme+თბილისი' },
  { id:243, name:'საცხობი 7',                 nameEn:'Satskhobi 7',               icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Satskhobi+7+თბილისი' },
  { id:244, name:'მარჯოს მექსიკური N1',       nameEn:'Marjos Meqsikuri N1',       icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Marjos+Meqsikuri+N1+თბილისი' },
  { id:245, name:'Mr. Gusto',                 nameEn:'Mr. Gusto',                 icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Mr+Gusto+თბილისი' },
  { id:246, name:'Tarantino',                 nameEn:'Tarantino',                 icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Tarantino+Shawarma+თბილისი' },
  { id:247, name:'3 შაურმა',                  nameEn:'3 Shawarma',                icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/3+Shawarma+თბილისი' },
  { id:248, name:'Pargo',                     nameEn:'Pargo',                     icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Pargo+Shawarma+თბილისი' },
  { id:249, name:'Lizandro',                  nameEn:'Lizandro',                  icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Lizandro+თბილისი' },
  { id:250, name:'Best Shawarma',             nameEn:'Best Shawarma',             icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Best+Shawarma+თბილისი' },
  { id:251, name:'Tavola',                    nameEn:'Tavola',                    icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Tavola+Shawarma+თბილისი' },
  { id:252, name:'მწვარადონა',                nameEn:'Mtsvaradona',               icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Mtsvaradona+თბილისი' },
  { id:253, name:'შაურმა ელდა',               nameEn:'Shawarma Elda',             icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Shawarma+Elda+თბილისი' },
  { id:254, name:'საშაურმე N1',               nameEn:'Sashaurme N1',              icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Sashaurme+N1+თბილისი' },
  { id:255, name:'Shawarma & Drive',          nameEn:'Shawarma & Drive',          icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Shawarma+Drive+თბილისი' },
  { id:256, name:'Mak Shawarma AN1 Tbilisi',  nameEn:'Mak Shawarma AN1 Tbilisi',  icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Mak+Shawarma+AN1+Tbilisi' },
  { id:257, name:'წერეთლის მექსიკური',        nameEn:'Tseretlis Meqsikuri',       icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Tseretlis+Meqsikuri+თბილისი' },
  { id:258, name:'Maxx Shawarma',             nameEn:'Maxx Shawarma',             icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Maxx+Shawarma+თბილისი' },
  { id:259, name:'Street Food შაურმა ნაკვერჩხალზე', nameEn:'Street Food Shawarma Nakverchkhalze', icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Street+Food+Shawarma+Nakverchkhalze+თბილისი' },
  { id:260, name:'Sida\'s Shawarma',          nameEn:'Sida\'s Shawarma',          icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Sidas+Shawarma+თბილისი' },
  { id:261, name:'Shawarma Inn',              nameEn:'Shawarma Inn',              icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Shawarma+Inn+თბილისი' },
  { id:262, name:'OK შაურმა ნაკვერჩხალზე',   nameEn:'OK Shawarma Nakverchkhalze', icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/OK+Shawarma+Nakverchkhalze+თბილისი' },
  { id:263, name:'ცომბინათი',                 nameEn:'Tsombinati',                icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Tsombinati+თბილისი' },
  { id:264, name:'ტაუკი',                      nameEn:'Tauk',                      icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Tauk+Shawarma+თბილისი' },
  { id:265, name:'Maq Shawarma',              nameEn:'Maq Shawarma',              icon:'🌯', cuisine:'shawarma', maps:'https://www.google.com/maps/search/Maq+Shawarma+თბილისი' },

  // ══ აზიური ══
  { id:98,  name:'სუში ბარი',          nameEn:'Sushi Bar',              icon:'🍣', cuisine:'asian', maps:'https://www.google.com/maps/search/Sushi+Bar+თბილისი' },
  { id:99,  name:'ტოკიო გარდენი',      nameEn:'Tokyo Garden',           icon:'🍱', cuisine:'asian', maps:'https://www.google.com/maps/search/Tokyo+Garden+თბილისი' },
  { id:100, name:'აზია ექსპრესი',      nameEn:'Asia Express',           icon:'🥢', cuisine:'asian', maps:'https://www.google.com/maps/search/Asia+Express+თბილისი' },
  { id:114, name:'Oishi',             nameEn:'Oishi',                  icon:'🍣', cuisine:'asian', maps:'https://www.google.com/maps/search/Oishi+თბილისი' },
  { id:131, name:'Maki-n-Sushi',       nameEn:'Maki-n-Sushi',           icon:'🍣', cuisine:'asian', maps:'https://www.google.com/maps/search/Maki-n-Sushi+თბილისი' },
  { id:147, name:'უნოში',              nameEn:'Unoshi',                 icon:'🥢', cuisine:'asian', maps:'https://www.google.com/maps/search/Unoshi+თბილისი' },
  { id:160, name:'სიანგანი',           nameEn:'Siangani',               icon:'🥢', cuisine:'asian', maps:'https://www.google.com/maps/search/Siangani+თბილისი' },
  { id:161, name:'სეული',              nameEn:'Seoul',                  icon:'🇰🇷', cuisine:'asian', maps:'https://www.google.com/maps/search/Seoul+Restaurant+თბილისი' },
  { id:162, name:'ბანგკოკი',           nameEn:'Bangkok',                icon:'🇹🇭', cuisine:'asian', maps:'https://www.google.com/maps/search/Bangkok+Restaurant+თბილისი' },
  { id:172, name:'ძინ-ჩაო',            nameEn:'Dzin-Chao',              icon:'🥢', cuisine:'asian', maps:'https://www.google.com/maps/search/Dzin+Chao+თბილისი' },
  { id:206, name:'ამაი',               nameEn:'Amai',                   icon:'🍣', cuisine:'asian', maps:'https://www.google.com/maps/search/Amai+თბილისი' },
  { id:209, name:'Sushi 24',           nameEn:'Sushi 24',               icon:'🍣', cuisine:'asian', maps:'https://www.google.com/maps/search/Sushi+24+თბილისი' },
  { id:211, name:'პო',                  nameEn:'Pho',                  icon:'🍜', cuisine:'asian', maps:'https://www.google.com/maps/search/Pho+Restaurant+თბილისი' },
  { id:212, name:'Sushi Way',            nameEn:'Sushi Way',            icon:'🍣', cuisine:'asian', maps:'https://www.google.com/maps/search/Sushi+Way+თბილისი' },
  { id:213, name:'სუშიკო',              nameEn:'Suchico',              icon:'🍣', cuisine:'asian', maps:'https://www.google.com/maps/search/Suchico+თბილისი' },
  { id:214, name:'ნანამი',               nameEn:'Nanami',               icon:'🍱', cuisine:'asian', maps:'https://www.google.com/maps/search/Nanami+თბილისი' },
  { id:215, name:'წვნიანი',             nameEn:'Tsvniani',             icon:'🥢', cuisine:'asian', maps:'https://www.google.com/maps/search/Tsvniani+თბილისი' },
  { id:216, name:'Wok Out',              nameEn:'Wok Out',              icon:'🥡', cuisine:'asian', maps:'https://www.google.com/maps/search/Wok+Out+თბილისი' },
  { id:217, name:'ლაფშიკო',             nameEn:'Lafshico',             icon:'🍜', cuisine:'asian', maps:'https://www.google.com/maps/search/Lafshico+თბილისი' },
  { id:218, name:'Woki Box',             nameEn:'Woki Box',             icon:'🥡', cuisine:'asian', maps:'https://www.google.com/maps/search/Woki+Box+თბილისი' },
  { id:219, name:'Roll n Roll',          nameEn:'Roll n Roll',          icon:'🍣', cuisine:'asian', maps:'https://www.google.com/maps/search/Roll+n+Roll+თბილისი' },
  { id:220, name:'Egoist',               nameEn:'Egoist',               icon:'🍣', cuisine:'asian', maps:'https://www.google.com/maps/search/Egoist+Sushi+თბილისი' },
  { id:221, name:'Sushi Minda',          nameEn:'Sushi Minda',          icon:'🍣', cuisine:'asian', maps:'https://www.google.com/maps/search/Sushi+Minda+თბილისი' },
  { id:222, name:'Woki & More',          nameEn:'Woki & More',          icon:'🥡', cuisine:'asian', maps:'https://www.google.com/maps/search/Woki+More+თბილისი' },
  { id:223, name:'Sushi Rolito',         nameEn:'Sushi Rolito',         icon:'🍣', cuisine:'asian', maps:'https://www.google.com/maps/search/Sushi+Rolito+თბილისი' },
  { id:224, name:'Gate',                 nameEn:'Gate',                 icon:'🍱', cuisine:'asian', maps:'https://www.google.com/maps/search/Gate+Restaurant+თბილისი' },
  { id:225, name:'Samura',               nameEn:'Samura',               icon:'⚔️', cuisine:'asian', maps:'https://www.google.com/maps/search/Samura+თბილისი' },
  { id:226, name:'Koichi Sushi',         nameEn:'Koichi Sushi',         icon:'🍣', cuisine:'asian', maps:'https://www.google.com/maps/search/Koichi+Sushi+თბილისი' },
  { id:227, name:'Qard Food',            nameEn:'Qard Food',            icon:'🥢', cuisine:'asian', maps:'https://www.google.com/maps/search/Qard+Food+თბილისი' },
  { id:228, name:'Sushi Room',           nameEn:'Sushi Room',           icon:'🍣', cuisine:'asian', maps:'https://www.google.com/maps/search/Sushi+Room+თბილისი' },
  { id:229, name:'Degusto Asian',        nameEn:'Degusto Asian',        icon:'🍱', cuisine:'asian', maps:'https://www.google.com/maps/search/Degusto+Asian+თბილისი' },
  { id:230, name:'Octopus Restaurant',   nameEn:'Octopus Restaurant',   icon:'🐙', cuisine:'asian', maps:'https://www.google.com/maps/search/Octopus+Restaurant+თბილისი' },
  { id:231, name:'Sushi Town',           nameEn:'Sushi Town',           icon:'🍣', cuisine:'asian', maps:'https://www.google.com/maps/search/Sushi+Town+თბილისი' },
  { id:232, name:'Wok & Walk',           nameEn:'Wok & Walk',           icon:'🥡', cuisine:'asian', maps:'https://www.google.com/maps/search/Wok+Walk+თბილისი' },
  { id:233, name:'Sushi Burrito',        nameEn:'Sushi Burrito',        icon:'🌯', cuisine:'asian', maps:'https://www.google.com/maps/search/Sushi+Burrito+თბილისი' },
  { id:234, name:'Fire Wok',             nameEn:'Fire Wok',             icon:'🔥', cuisine:'asian', maps:'https://www.google.com/maps/search/Fire+Wok+თბილისი' },
  { id:235, name:'Happy Taste',          nameEn:'Happy Taste',          icon:'😊', cuisine:'asian', maps:'https://www.google.com/maps/search/Happy+Taste+თბილისი' },
  { id:236, name:'Chackie Chan Sushi',   nameEn:'Chackie Chan Sushi',   icon:'🥋', cuisine:'asian', maps:'https://www.google.com/maps/search/Chackie+Chan+Sushi+თბილისი' },
  { id:237, name:'Royal Rolls',          nameEn:'Royal Rolls',          icon:'👑', cuisine:'asian', maps:'https://www.google.com/maps/search/Royal+Rolls+თბილისი' },
  { id:238, name:'Sakura Sushi',         nameEn:'Sakura Sushi',         icon:'🌸', cuisine:'asian', maps:'https://www.google.com/maps/search/Sakura+Sushi+თბილისი' },
  { id:239, name:'Fattoom',              nameEn:'Fattoom',              icon:'🍱', cuisine:'asian', maps:'https://www.google.com/maps/search/Fattoom+თბილისი' },
  { id:240, name:'305',                  nameEn:'305',                  icon:'🥢', cuisine:'asian', maps:'https://www.google.com/maps/search/305+Restaurant+თბილისი' },
];
 
/* ══ STATE ══ */
let searchMode = 'food', sortFood = 'quality', sortRest = 'overall';
let activeChip = '', currentStep = 1;
let selectedRest = null, addedDishes = [], restCriteria = {}, selectedCat = null;
let fbReviews = [], foodStats = {}, restStats = {};
let activeCuisine = 'georgian'; let activeCuisineFood = 'georgian';
 
/* ══ Auth ══ */
onAuthStateChanged(auth, user => {
  currentUser = user;
  const btn    = document.getElementById('auth-btn-text');
  const name   = document.getElementById('auth-user-name');
  const favTab = document.getElementById('tab-favs');
  if (user) {
    btn.textContent      = '🚪 გამოსვლა';
    name.textContent     = user.displayName?.split(' ')[0] || '';
    name.style.display   = 'inline';
    favTab.style.display = '';
    loadFavs();
    checkMyRequests();
  } else {
    btn.textContent      = '🔑 შესვლა';
    name.style.display   = 'none';
    favTab.style.display = 'none';
    userFavs = [];
  }
}); 
async function signInGoogle() {
  try {
    auth.useDeviceLanguage();
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, provider);
    closeLogin();
    if (window._pendingReview) { window._pendingReview = false; showPage('review'); }
  } catch(e) { 
    console.error('Auth error:', e.code, e.message);
    if (e.code === 'auth/popup-blocked') {
      alert('გთხოვ დაუშვა Popup ამ საიტზე — მისამართების ზოლში დააჭირე popup-ის ნებართვას');
    }
  }
  if (window._pendingFavs) { window._pendingFavs = false; showPage('favs'); }
}
 
function handleAuth() {
  if (currentUser) {
    signOut(auth);
  } else {
    openLogin();
  }
}
 
function requireAuth() {
  if (currentUser) {
    showPage('review');
  } else {
    window._pendingReview = true;
    openLogin();
  }
}
 
function openLogin()  { document.getElementById('login-overlay').classList.remove('hidden'); }
function closeLogin() { document.getElementById('login-overlay').classList.add('hidden'); window._pendingReview = false; }
 
/* ══ ფავორიტები ══ */
async function loadFavs() {
  if (!currentUser) return;
  try {
    const q    = query(collection(db,'favs'), where('userId','==',currentUser.uid));
    const snap = await getDocs(q);
    userFavs   = snap.docs.map(d => ({ docId:d.id, ...d.data() }));
    renderFavs(); renderFoodResults(); renderRestResults();
  } catch(e) { console.error(e); }
}
 
function isFavDish(restName, dishName) {
  return userFavs.some(f => f.type==='dish' && f.restName===restName && f.dishName===dishName);
}
function isFavRest(restName) {
  return userFavs.some(f => f.type==='rest' && f.restName===restName);
}
 
async function toggleFav(e, type, restName, dishName) {
  e.stopPropagation();
  if (!currentUser) { openLogin(); return; }
  const existing = type==='dish'
    ? userFavs.find(f => f.type==='dish' && f.restName===restName && f.dishName===dishName)
    : userFavs.find(f => f.type==='rest' && f.restName===restName);
  if (existing) {
    try {
      await deleteDoc(firestoreDoc(db,'favs',existing.docId));
    } catch(e) { console.error(e); }
  } else {
    const restObj = RESTAURANTS.find(r => r.name===restName);
    try {
      await addDoc(collection(db,'favs'), {
        userId: currentUser.uid, type, restName,
        restIcon: restObj?.icon||'🏠',
        ...(type==='dish' ? { dishName } : {}),
      });
    } catch(e) { console.error(e); }
  }
  await loadFavs();
}
 
function renderFavs() {
  const wrap = document.getElementById('favs-list');
  if (!wrap) return;
  if (!userFavs.length) {
    wrap.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem">ფავორიტები ცარიელია</p>';
    return;
  }
  wrap.innerHTML = '';
  userFavs.forEach(f => {
    const card = document.createElement('div');
    card.className = 'fav-card';
    if (f.type === 'dish') {
      const stats = foodStats[f.dishName]?.[f.restName];
      const q     = stats ? (stats.totalQuality/stats.count).toFixed(1) : '—';
      const stars = stats ? '★'.repeat(Math.round(stats.totalQuality/stats.count))+'☆'.repeat(5-Math.round(stats.totalQuality/stats.count)) : '☆☆☆☆☆';
      card.innerHTML = `
        <div class="fav-card-icon">${f.restIcon}</div>
        <div class="fav-card-info">
          <div class="fav-card-name">${f.restName}</div>
          <div class="fav-card-sub">🍽️ ${f.dishName} &nbsp;<span style="color:var(--gold)">${stars}</span> ${q}</div>
        </div>
        <button class="fav-remove" onclick="toggleFav(event,'dish','${f.restName}','${f.dishName}')">✕</button>`;
    } else {
      const s     = restStats[f.restName];
      const avg   = s ? ((s.totalService+s.totalEnv)/(s.count*2)).toFixed(1) : '—';
      const svc   = s ? (s.totalService/s.count).toFixed(1) : '—';
      const env   = s ? (s.totalEnv/s.count).toFixed(1) : '—';
      const music = s ? mostCommon(s.musics) : '—';
      card.innerHTML = `
        <div class="fav-card-icon">${f.restIcon}</div>
        <div class="fav-card-info">
          <div class="fav-card-name">${f.restName}</div>
          <div class="fav-card-sub">⭐ ${avg} &nbsp;👋 ${svc} &nbsp;🏠 ${env} &nbsp;🎵 ${music}</div>
        </div>
        <button class="fav-remove" onclick="toggleFav(event,'rest','${f.restName}',null)">✕</button>`;
    }
    wrap.appendChild(card);
  });
}
 
function requireAuthFavs() {
  if (currentUser) showPage('favs');
  else { window._pendingFavs=true; openLogin(); }
}
 
/* ══ კომენტარები ══ */
function getComments(restName, dishName) {
  const results = [];
  fbReviews.forEach(rev => {
    if (rev.restaurantName !== restName) return;
    (rev.dishes||[]).forEach(d => {
      if (d.name !== dishName) return;
      const comment = [rev.serviceComment, rev.envComment, rev.musicComment, rev.waitComment, rev.priceComment]
        .filter(Boolean).join(' · ');
      results.push({ stars: d.stars, userName: rev.userName||'ანონიმი', comment });
    });
  });
  return results;
}
 
function toggleComments(cardId) {
  const wrap = document.getElementById('comments-'+cardId);
  if (wrap) wrap.classList.toggle('open');
}
 
/* ══ Firebase წაკითხვა ══ */
async function loadReviews() {
  try {
    console.log('loading reviews...');
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    console.log('query created:', q);
    const snap = await getDocs(q);
    console.log('snap:', snap.size);
    fbReviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    buildStats(); renderFoodResults(); renderRestResults();
  } catch(e) { 
    console.error('loadReviews error:', e);
    fbReviews = [];
    buildStats(); renderFoodResults(); renderRestResults();
  }
}
 
function buildStats() {
  foodStats = {}; restStats = {};
  fbReviews.forEach(rev => {
    const rn = rev.restaurantName;
    if (!restStats[rn]) restStats[rn] = { totalService:0, totalEnv:0, count:0, musics:[], waits:[], prices:[] };
    restStats[rn].totalService += rev.service||0;
    restStats[rn].totalEnv     += rev.env||0;
    restStats[rn].count++;
    if (rev.music) restStats[rn].musics.push(rev.music);
    if (rev.wait)  restStats[rn].waits.push(rev.wait);
    if (rev.price) restStats[rn].prices.push(rev.price);
    (rev.dishes||[]).forEach(dish => {
      if (!foodStats[dish.name]) foodStats[dish.name] = {};
      if (!foodStats[dish.name][rn]) foodStats[dish.name][rn] = { totalQuality:0, count:0, prices:[], waits:[] };
      foodStats[dish.name][rn].totalQuality += dish.stars||0;
      foodStats[dish.name][rn].count++;
      if (rev.price) foodStats[dish.name][rn].prices.push(rev.price);
      if (rev.wait)  foodStats[dish.name][rn].waits.push(rev.wait);
    });
  });
}
 
function mostCommon(arr) {
  if (!arr||!arr.length) return '—';
  const f = {}; arr.forEach(v => f[v]=(f[v]||0)+1);
  return Object.entries(f).sort((a,b)=>b[1]-a[1])[0][0];
}
 
/* ══ PAGE SWITCH ══ */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  const titles = { search:'საკვებისა და რესტორნის ძებნა', review:'შეფასება', favs:'ჩემი ფავორიტები' };
  const subs   = { search:'მოძებნე საჭმელი ან რესტორანი', review:'შეაფასე ის რაც ჭამე', favs:'შენახული კერძები და რესტორნები' };
  document.getElementById('hero-title').textContent = titles[id];
  document.getElementById('hero-sub').textContent   = subs[id];
  window.scrollTo({top:0,behavior:'smooth'});
}
function goHome() { showPage('search'); }
 
/* ══ SEARCH MODE ══ */
function setSearchMode(mode) {
  searchMode = mode;
  document.getElementById('stog-food').classList.toggle('active', mode==='food');
  document.getElementById('stog-rest').classList.toggle('active', mode==='rest');
  document.getElementById('search-food').classList.toggle('hidden', mode!=='food');
  document.getElementById('search-rest').classList.toggle('hidden', mode!=='rest');
  mode==='food' ? renderFoodResults() : renderRestResults();
}
 
/* ══ FOOD RESULTS ══ */
const priceOrder = {'ხელმისაწვდომი':1,'საშუალო':2,'ძვირი':3};
const waitOrder  = {'სწრაფი':1,'საშუალო':2,'ნელი':3};
const priceBadge = {'ხელმისაწვდომი':'badge-cheap','საშუალო':'badge-mid','ძვირი':'badge-exp'};
const priceEmoji = {'ხელმისაწვდომი':'💚','საშუალო':'🟡','ძვირი':'🔴'};
 
let activeFoodCat = null;
let activeFoodDish = null;
 
function buildFoodCatGrid() {
  const wrap = document.getElementById('food-cat-grid');
  if (!wrap) return;
  wrap.innerHTML = '';
  const menu = MENUS[activeCuisineFood] || MENUS.georgian;
  Object.keys(menu).forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'food-cat-btn';
    btn.innerHTML = `${CAT_ICON[cat]||'🍽️'} ${cat}`;
    btn.onclick = () => toggleFoodCat(btn, cat);
    wrap.appendChild(btn);
  });
}
 
function toggleFoodCat(el, cat) {
  const dishWrap = document.getElementById('food-dish-wrap');
  const dishGrid = document.getElementById('food-dish-grid');

  if (activeFoodCat === cat) {
    activeFoodCat = null;
    activeFoodDish = null;
    el.classList.remove('active');
    dishWrap.classList.add('hidden');
    dishGrid.innerHTML = '';
    renderFoodResults();
    return;
  }

  document.querySelectorAll('.food-cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  activeFoodCat = cat;
  activeFoodDish = null;

  dishGrid.innerHTML = '';
  const baseMenu = MENUS[activeCuisineFood] || MENUS.georgian;

  // extraDishes ყველა რესტორნიდან ამ cuisine-ისთვის
  const extraDishes = [];
  RESTAURANTS
    .filter(r => r.cuisine === activeCuisineFood)
    .forEach(r => {
      if (r.extraDishes?.[cat]) {
        r.extraDishes[cat].forEach(d => {
          if (!extraDishes.includes(d) && !baseMenu[cat]?.includes(d)) {
            extraDishes.push(d);
          }
        });
      }
    });
  const allDishes = [...(baseMenu[cat]||[]), ...extraDishes];
  (baseMenu[cat]||[]).forEach(dish => {
    const btn = document.createElement('button');
    btn.className = 'food-dish-btn';
    btn.textContent = dish;
    btn.onclick = () => selectFoodDish(btn, dish);
    dishGrid.appendChild(btn);
  });

  dishWrap.classList.remove('hidden');
  renderFoodResults();
}
 
function selectFoodDish(el, dish) {
  if (activeFoodDish === dish) {
    activeFoodDish = null;
    document.querySelectorAll('.food-dish-btn').forEach(b => b.classList.remove('active'));
  } else {
    document.querySelectorAll('.food-dish-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    activeFoodDish = dish;
  }
  renderFoodResults();
}
 
function filterByChip(el, cat) { }
function filterFoodResults() { renderFoodResults(); }
function setSortFood(btn, s) {
  document.querySelectorAll('#search-food .sort-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); sortFood=s; renderFoodResults();
}
 
function renderFoodResults() {
  const q  = (document.getElementById('food-search-inp').value||'').toLowerCase();
  const el = document.getElementById('food-results');
  el.innerHTML = '';

  const menu = MENUS[activeCuisineFood] || MENUS.georgian;
  const menuDishes = Object.values(menu).flat();
  RESTAURANTS
    .filter(r => r.cuisine === activeCuisineFood)
    .forEach(r => {
      if (r.extraDishes) {
        Object.values(r.extraDishes).forEach(dishes => menuDishes.push(...dishes));
      }
    });

  const cuisineRests = new Set(
    RESTAURANTS.filter(r => r.cuisine === activeCuisineFood).map(r => r.name)
  );

  let dishes = Object.keys(foodStats).filter(d => {
    if (menuDishes.includes(d)) return true;
    return Object.keys(foodStats[d]).some(restName => cuisineRests.has(restName));
  });

  if (activeFoodDish) {
    dishes = dishes.filter(n => n === activeFoodDish);
  }  else if (activeFoodCat) {
    const catItems = menu[activeFoodCat] || [];
    // extraDishes ამ კატეგორიაში
    const extraCatItems = [];
    RESTAURANTS
      .filter(r => r.cuisine === activeCuisineFood)
      .forEach(r => {
        if (r.extraDishes?.[activeFoodCat]) {
          extraCatItems.push(...r.extraDishes[activeFoodCat]);
        }
      });
    // foodStats-იდან ამ cuisine-ის რესტორნების კერძები ამ კატეგორიაში
    dishes = dishes.filter(n => 
      catItems.includes(n) || 
      extraCatItems.includes(n) ||
      Object.keys(foodStats[n] || {}).some(restName => {
        const rest = RESTAURANTS.find(r => r.name === restName);
        return rest?.cuisine === activeCuisineFood && 
               rest?.extraDishes?.[activeFoodCat]?.includes(n);
      })
    );
  }
  if (q) dishes = dishes.filter(n => n.toLowerCase().includes(q));

  if (!dishes.length) {
    el.innerHTML='<p style="color:var(--text-muted);padding:1rem 0">შეფასება ჯერ არ არის ✍️</p>';
    return;
  }

  dishes.forEach(dishName => {
    let rests = Object.entries(foodStats[dishName]).map(([rn,s])=>({
      rest:rn, quality:s.count?s.totalQuality/s.count:0,
      price:mostCommon(s.prices), wait:mostCommon(s.waits), count:s.count
    }));
    if (sortFood==='quality') rests.sort((a,b)=>b.quality-a.quality);
    if (sortFood==='price')   rests.sort((a,b)=>(priceOrder[a.price]||9)-(priceOrder[b.price]||9));
    if (sortFood==='wait')    rests.sort((a,b)=>(waitOrder[a.wait]||9)-(waitOrder[b.wait]||9));

    const catE = Object.entries(menu).find(([,items])=>items.includes(dishName));
    const emoji = catE ? (CAT_ICON[catE[0]]||'🍽️') : '🍽️';

    const sec = document.createElement('div');
    sec.style.cssText='margin-bottom:1.5rem';
    sec.innerHTML=`<div style="font-family:'Noto Serif Georgian',serif;font-weight:700;font-size:1rem;color:var(--wine-dark);margin-bottom:0.6rem">${emoji} ${dishName}</div>`;

    rests.forEach((r,i)=>{
      const displayVal = sortFood==='price' ? r.price : sortFood==='wait' ? r.wait : r.quality.toFixed(1);
      const scoreLabel = sortFood==='price' ? 'ფასი' : sortFood==='wait' ? 'მოლოდინი' : 'ხარისხი';
      const stars='★'.repeat(Math.round(r.quality))+'☆'.repeat(5-Math.round(r.quality));
      const ro=RESTAURANTS.find(re=>re.name===r.rest);
      const cid='d'+i+'_'+dishName.replace(/\s/g,'_')+'_'+r.rest.replace(/\s/g,'_');
      const comments=getComments(r.rest, dishName);
      const commHtml=comments.map(cm=>`
        <div class="comment-row">
          <div class="comment-meta">
            <span class="comment-stars">${'★'.repeat(cm.stars)}${'☆'.repeat(5-cm.stars)}</span>
            <span>${cm.userName}</span>
          </div>
          ${cm.comment?`<div>${cm.comment}</div>`:''}
        </div>`).join('');

      sec.innerHTML+=`<div class="result-card" id="${cid}">
        <div class="result-rank">#${i+1}</div>
        <div class="result-icon">${ro?.icon||'🏠'}</div>
        <div class="result-info">
          <div class="result-name">${r.rest}</div>
          <div class="result-meta">
            <span class="result-stars">${stars}</span>
            <span class="badge ${priceBadge[r.price]||'badge-mid'}">${priceEmoji[r.price]||'🟡'} ${r.price}</span>
            &nbsp;⏱️ ${r.wait}
            &nbsp;<span style="color:var(--text-muted);font-size:0.72rem">${r.count} შეფ.</span>
          </div>
          ${comments.length?`<button class="show-comments-btn" onclick="toggleComments('${cid}')">💬 კომენტარები (${comments.length})</button>`:''}
          <div class="comments-wrap" id="comments-${cid}">${commHtml}</div>
        </div>
        <div class="result-score">${displayVal}<span class="score-label">${scoreLabel}</span></div>
        <button class="fav-btn ${isFavDish(r.rest,dishName)?'active':''}" onclick="toggleFav(event,'dish','${r.rest}','${dishName}')">❤️</button>
      </div>`;
    });
    el.appendChild(sec);
  });
}
 
/* ══ REST RESULTS ══ */
function filterRestResults() { renderRestResults(); }
function setSortRest(btn, s) {
  document.querySelectorAll('#search-rest .sort-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); sortRest=s; renderRestResults();
}
 
function renderRestResults() {
  const q  = (document.getElementById('rest-search-inp').value||'').toLowerCase();
  const el = document.getElementById('rest-results');
  el.innerHTML='';
  let data = RESTAURANTS
    .filter(r => r.cuisine === activeCuisine)
    .filter(r => !q || r.name.toLowerCase().includes(q) || r.nameEn.toLowerCase().includes(q))
    .map(r => {
      const s = restStats[r.name];
      return { ...r,
        avgService: s ? s.totalService/s.count : null,
        avgEnv:     s ? s.totalEnv/s.count : null,
        avgOverall: s ? (s.totalService+s.totalEnv)/(s.count*2) : null,
        count:      s ? s.count : 0,
        topMusic:   s ? mostCommon(s.musics) : '—',
        topWait:    s ? mostCommon(s.waits)  : '—',
        topPrice:   s ? mostCommon(s.prices) : '—'
      };
    }).filter(r => r.count > 0);

  if (sortRest==='overall') data.sort((a,b)=>(b.avgOverall||0)-(a.avgOverall||0));
  if (sortRest==='service') data.sort((a,b)=>(b.avgService||0)-(a.avgService||0));
  if (sortRest==='env')     data.sort((a,b)=>(b.avgEnv||0)-(a.avgEnv||0));

  if (!data.length) {
    el.innerHTML='<p style="color:var(--text-muted);padding:1rem 0">შეფასება ჯერ არ არის ✍️</p>';
    return;
  }
  data.forEach((r,i) => {
    const sortVal = sortRest==='service' ? r.avgService : sortRest==='env' ? r.avgEnv : r.avgOverall;
    const score = sortVal ? sortVal.toFixed(1) : '—';
    const stars = sortVal ? '★'.repeat(Math.round(sortVal))+'☆'.repeat(5-Math.round(sortVal)) : '☆☆☆☆☆';
    const scoreLabel = sortRest==='service' ? 'მომსახ.' : sortRest==='env' ? 'გარემო' : 'საერთო';
    const restComments = fbReviews
      .filter(rev => rev.restaurantName === r.name)
      .filter(rev => rev.serviceComment || rev.envComment || rev.musicComment || rev.waitComment || rev.priceComment)
      .map(rev => ({
        userName: rev.userName || 'ანონიმი',
        service: rev.service,
        env: rev.env,
        music: rev.music,
        wait: rev.wait,
        price: rev.price,
        serviceComment: rev.serviceComment,
        envComment: rev.envComment,
        musicComment: rev.musicComment,
        waitComment: rev.waitComment,
        priceComment: rev.priceComment,
      }));

    const commHtml = restComments.map(cm => `
      <div class="comment-row">
        <div class="comment-meta">
          <span>${cm.userName}</span>
          <span>👋 ${'★'.repeat(cm.service||0)}</span>
          <span>🏠 ${'★'.repeat(cm.env||0)}</span>
          <span>🎵 ${cm.music||'—'}</span>
          <span>⏱️ ${cm.wait||'—'}</span>
          <span>💰 ${cm.price||'—'}</span>
        </div>
        ${cm.serviceComment ? `<div>👋 ${cm.serviceComment}</div>` : ''}
        ${cm.envComment     ? `<div>🏠 ${cm.envComment}</div>`     : ''}
        ${cm.musicComment   ? `<div>🎵 ${cm.musicComment}</div>`   : ''}
        ${cm.waitComment    ? `<div>⏱️ ${cm.waitComment}</div>`    : ''}
        ${cm.priceComment   ? `<div>💰 ${cm.priceComment}</div>`   : ''}
      </div>`).join('');

    const cid = 'r_' + r.name.replace(/\s/g,'_');

    el.innerHTML+=`<div class="result-card">
      <div class="result-rank">#${i+1}</div>
      <div class="result-icon" onclick="window.open('${r.maps}','_blank')" style="cursor:pointer">${r.icon}</div>
      <div class="result-info">
        <div class="result-name" onclick="window.open('${r.maps}','_blank')" style="cursor:pointer">
          ${r.name} <span style="font-size:0.72rem;color:var(--text-muted)">${r.nameEn}</span>
        </div>
        <div class="result-meta">
          <span class="result-stars">${stars}</span>
          &nbsp;👋 ${r.avgService?.toFixed(1)||'—'}
          &nbsp;🏠 ${r.avgEnv?.toFixed(1)||'—'}
          &nbsp;🎵 ${r.topMusic}
          &nbsp;<span style="color:var(--text-muted);font-size:0.72rem">${r.count} შეფ.</span>
        </div>
        ${restComments.length ? `<button class="show-comments-btn" onclick="toggleComments('${cid}')">💬 კომენტარები (${restComments.length})</button>` : ''}
        <div class="comments-wrap" id="comments-${cid}">${commHtml}</div>
      </div>
      <div class="result-score">${score}<span class="score-label">${scoreLabel}</span></div>
      <button class="fav-btn ${isFavRest(r.name)?'active':''}" onclick="toggleFav(event,'rest','${r.name}',null)">❤️</button>
    </div>`;
  });
}
function setCuisine(el, cuisine) {
  activeCuisine = cuisine;
  document.querySelectorAll('.cuisine-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderRestResults();
}
window.setCuisine = setCuisine;
function setCuisineFood(el, cuisine) {
  activeCuisineFood = cuisine;
  document.querySelectorAll('.cuisine-btn-food').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  activeFoodCat = null;
  activeFoodDish = null;
  document.querySelectorAll('.food-cat-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('food-dish-wrap').classList.add('hidden');
  document.getElementById('food-dish-grid').innerHTML = '';
  buildFoodCatGrid();
  renderFoodResults();
}
window.setCuisineFood = setCuisineFood;
 
/* ══ REVIEW ══ */
function buildRestGrid() {
  const grid=document.getElementById('rest-grid'); grid.innerHTML='';
  RESTAURANTS.forEach(r=>{
    const div=document.createElement('div');
    div.className='rest-card'; div.dataset.id=r.id;
    div.innerHTML=`<div class="rest-card-icon">${r.icon}</div><div><div class="rest-card-name">${r.name}</div><div class="rest-card-sub">${r.nameEn}</div></div>`;
    div.onclick=()=>selectRestCard(div,r); grid.appendChild(div);
  });
}
 
function filterRestCards(q) {
  q=q.toLowerCase();
  document.querySelectorAll('.rest-card').forEach(c=>{
    const n=c.querySelector('.rest-card-name').textContent.toLowerCase();
    const e=c.querySelector('.rest-card-sub').textContent.toLowerCase();
    c.style.display=(!q||n.includes(q)||e.includes(q))?'':'none';
  });
}
 
function selectRestCard(el, r) {
  document.querySelectorAll('.rest-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedRest = r;
  document.getElementById('rv-next1').disabled = false;
  // კუზინის მიხედვით კატეგორიები გადავაწყოთ
  selectedCat = null;
  document.getElementById('cat-grid').innerHTML = '';
  document.getElementById('dish-buttons').innerHTML = '';
  document.getElementById('dish-buttons-wrap').classList.add('hidden');
}
 
/* კატეგორია → კერძი */
function buildCategoryGrid() {
  const wrap = document.getElementById('cat-grid'); wrap.innerHTML = '';
  const cuisine = selectedRest?.cuisine || 'georgian';
  const menu = MENUS[cuisine] || MENUS.georgian;
  Object.keys(menu).forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.innerHTML = `${CAT_ICON[cat]||'🍽️'} ${cat}`;
    btn.onclick = () => selectCategory(btn, cat);
    wrap.appendChild(btn);
  });
}
 
function selectCategory(el,cat) {
  document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active'); selectedCat=cat;
  renderDishButtons(cat);
  document.getElementById('dish-buttons-wrap').classList.remove('hidden');
}
 
function renderDishButtons(cat) {
  const wrap = document.getElementById('dish-buttons');
  const q = (document.getElementById('dish-search-inp')?.value||'').toLowerCase();
  const cuisine = selectedRest?.cuisine || 'georgian';
  const baseMenu = MENUS[cuisine] || MENUS.georgian;
  const menu = {};
  Object.keys(baseMenu).forEach(c => {
    const extra = selectedRest?.extraDishes?.[c] || [];
    menu[c] = [...baseMenu[c], ...extra];
  });
  wrap.innerHTML = '';

  // ძველი ფორმა წაშალე
  const oldForm = document.getElementById('inline-req-form');
  if (oldForm) oldForm.remove();

  (menu[cat]||[]).filter(d => !q || d.toLowerCase().includes(q)).forEach(dish => {
    const already = addedDishes.find(d => d.name === dish);
    const btn = document.createElement('button');
    btn.className = 'dish-pill-btn' + (already ? ' added' : '');
    btn.textContent = dish;
    btn.onclick = () => { if (!already) addDishDirect(dish, cat); };
    wrap.appendChild(btn);
  });

  // "+ ვერ ვპოულობ კერძს" ღილაკი
  const addBtn = document.createElement('button');
  addBtn.className = 'dish-pill-btn dish-pill-request';
  addBtn.textContent = '+ ვერ ვპოულობ კერძს';
  addBtn.onclick = () => toggleRequestForm(cat);
  wrap.appendChild(addBtn);

  // მოთხოვნის ფორმა
  const formWrap = document.createElement('div');
  formWrap.id = 'inline-req-form';
  formWrap.className = 'hidden';
  formWrap.style.cssText = 'margin-top:0.75rem;display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap';
  formWrap.innerHTML = `
    <input class="search-input" id="inline-req-dish"
      placeholder="კერძის სახელი..."
      style="flex:1;min-width:180px;padding:0.6rem 1rem"/>
    <button class="btn-add" id="inline-req-submit" onclick="submitInlineRequest()">📩 მოთხოვნა</button>
    <span id="inline-req-ok" class="hidden" style="color:green;font-weight:700;font-size:0.85rem">✅ გაიგზავნა!</span>
  `;
  wrap.parentNode.appendChild(formWrap);
}
function toggleRequestForm(cat) {
  const form = document.getElementById('inline-req-form');
  if (!form) return;
  form.classList.toggle('hidden');
  form._cat = cat;
  if (!form.classList.contains('hidden')) {
    document.getElementById('inline-req-dish').focus();
  }
}

async function submitInlineRequest() {
  if (!currentUser) { openLogin(); return; }
  const dishName = document.getElementById('inline-req-dish').value.trim();
  if (!dishName) return;
  const form = document.getElementById('inline-req-form');
  const cat = form._cat || selectedCat || '';
  const btn = document.getElementById('inline-req-submit');
  btn.disabled = true; btn.textContent = '⏳...';

  try {
    await addDoc(collection(db, 'product_requests'), {
      userId:    currentUser.uid,
      userName:  currentUser.displayName,
      userEmail: currentUser.email,
      restName:  selectedRest?.name || '—',
      restId:    selectedRest?.id || null,
      cuisine:   selectedRest?.cuisine || 'georgian',
      category:  cat,
      dishName,
      status:    'pending',
      createdAt: serverTimestamp(),
    });

    // პირდაპირ შეფასებაში ემატება
    const emoji = CAT_ICON[cat] || '🍽️';
    if (!addedDishes.find(d => d.name === dishName)) {
      addedDishes.push({ name: dishName, emoji, stars: 0 });
      renderDishList();
      if (selectedCat) renderDishButtons(selectedCat);
    }

    document.getElementById('inline-req-dish').value = '';
    document.getElementById('inline-req-ok').classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('inline-req-ok').classList.add('hidden');
      form.classList.add('hidden');
    }, 2000);

  } catch(err) {
    console.error(err); alert('შეცდომა, სცადე თავიდან');
  }
  btn.disabled = false; btn.textContent = '📩 მოთხოვნა';
}
window.submitInlineRequest = submitInlineRequest;
window.toggleRequestForm = toggleRequestForm;
 
function filterDishButtons() { if(selectedCat) renderDishButtons(selectedCat); }
 
function addDishDirect(name,cat) {
  if(addedDishes.find(d=>d.name===name)) return;
  addedDishes.push({name, emoji:CAT_ICON[cat]||'🍽️', stars:0});
  renderDishList(); if(selectedCat) renderDishButtons(selectedCat);
}
 
function removeDish(idx) {
  addedDishes.splice(idx,1); renderDishList();
  if(selectedCat) renderDishButtons(selectedCat);
}
 
function setDishStar(idx,val) {
  addedDishes[idx].stars=val; renderDishList();
}
 
function renderDishList() {
  const list=document.getElementById('dish-list'); list.innerHTML='';
  addedDishes.forEach((d,idx)=>{
    const row=document.createElement('div'); row.className='dish-row';
    let sh=''; for(let i=1;i<=5;i++) sh+=`<span class="s ${d.stars>=i?'on':''}" onclick="setDishStar(${idx},${i})">★</span>`;
    row.innerHTML=`<span class="dish-emoji">${d.emoji}</span><span class="dish-name">${d.name}</span><div class="dish-stars-inline">${sh}</div><button class="dish-remove" onclick="removeDish(${idx})">✕</button>`;
    list.appendChild(row);
  });
  document.getElementById('rv-next2').disabled=addedDishes.length===0||addedDishes.some(d=>d.stars===0);
}
 
/* ვარსკვლავები */
function buildStarRows() {
  document.querySelectorAll('.star-row').forEach(row=>{
    const field=row.dataset.field; row.innerHTML='';
    for(let i=1;i<=5;i++){
      const s=document.createElement('span'); s.className='star-r'; s.textContent='★';
      s.onclick=()=>setStarField(row,field,i);
      s.onmouseenter=()=>previewStarField(row,i);
      s.onmouseleave=()=>clearStarPreview(row,restCriteria[field]||0);
      row.appendChild(s);
    }
  });
}
function setStarField(row,field,val) {
  restCriteria[field]=val;
  row.querySelectorAll('.star-r').forEach((s,i)=>s.classList.toggle('on',i<val));
  checkStep3();
}
function previewStarField(row,val) { row.querySelectorAll('.star-r').forEach((s,i)=>s.classList.toggle('on',i<val)); }
function clearStarPreview(row,val) { row.querySelectorAll('.star-r').forEach((s,i)=>s.classList.toggle('on',i<val)); }
 
function selectPill(el) {
  const group=el.closest('.pill-group'); const field=group.dataset.field;
  group.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
  el.classList.add('active'); restCriteria[field]=el.textContent.trim(); checkStep3();
}
 
function checkStep3() {
  const ok=restCriteria.service&&restCriteria.env&&restCriteria.music&&restCriteria.wait&&restCriteria.price;
  document.getElementById('rv-next3').disabled=!ok;
}
 
function goStep(n) {
  [1,2,3,4].forEach(i=>{
    document.getElementById(`rv-step${i}`).classList.toggle('hidden',i!==n);
    const s=document.getElementById(`rv-s${i}`);
    s.classList.remove('active','done');
    if(i<n) s.classList.add('done');
    if(i===n) s.classList.add('active');
  });
  currentStep=n;

  if (n === 2) {
    selectedCat = null;
    document.getElementById('dish-buttons').innerHTML = '';
    document.getElementById('dish-buttons-wrap').classList.add('hidden');
    document.getElementById('dish-search-inp').value = '';
    buildCategoryGrid();
  }

  window.scrollTo({top:0,behavior:'smooth'});
}
 
/* Firebase შენახვა */
async function submitReview() {
  if (!currentUser) { openLogin(); return; }

  const btn = document.getElementById('rv-next3');
  btn.disabled = true; btn.textContent = '⏳ ინახება...';

  try {
    const dupQ = query(
      collection(db, 'reviews'),
      where('userId', '==', currentUser.uid),
      where('restaurantId', '==', selectedRest.id)
    );
    const dupSnap = await getDocs(dupQ);

    const reviewData = {
      userId:         currentUser.uid,
      userEmail:      currentUser.email,
      userName:       currentUser.displayName,
      restaurantId:   selectedRest.id,
      restaurantName: selectedRest.name,
      dishes:         addedDishes.map(d => ({ name: d.name, stars: d.stars })),
      service:        restCriteria.service,
      env:            restCriteria.env,
      music:          restCriteria.music,
      wait:           restCriteria.wait,
      price:          restCriteria.price,
      serviceComment: document.querySelector('[data-field="service-comment"]').value.trim(),
      envComment:     document.querySelector('[data-field="env-comment"]').value.trim(),
      musicComment:   document.querySelector('[data-field="music-comment"]').value.trim(),
      waitComment:    document.querySelector('[data-field="wait-comment"]').value.trim(),
      priceComment:   document.querySelector('[data-field="price-comment"]').value.trim(),
      updatedAt:      serverTimestamp(),
    };

    if (!dupSnap.empty) {
      // ძველი review განახლდება
      const existingDoc = dupSnap.docs[0];
      await updateDoc(firestoreDoc(db, 'reviews', existingDoc.id), reviewData);
    } else {
      // ახალი review იქმნება
      reviewData.createdAt = serverTimestamp();
      await addDoc(collection(db, 'reviews'), reviewData);
    }

    const dl = addedDishes.map(d =>
      `${d.emoji} ${d.name}: ${'★'.repeat(d.stars)}${'☆'.repeat(5 - d.stars)}`
    ).join('<br/>');

    document.getElementById('success-summary').innerHTML = `
      <b>რესტორანი:</b> ${selectedRest.name}<br/>
      <b>კერძები:</b><br/>${dl}<br/>
      <b>მომსახურება:</b> ${'★'.repeat(restCriteria.service || 0)}<br/>
      <b>გარემო:</b> ${'★'.repeat(restCriteria.env || 0)}<br/>
      <b>მუსიკა:</b> ${restCriteria.music || '—'}<br/>
      <b>მოლოდინი:</b> ${restCriteria.wait || '—'}<br/>
      <b>ფასი:</b> ${restCriteria.price || '—'}`;

    goStep(4);
    await loadReviews();

  } catch(e) {
    console.error(e);
    alert('შეცდომა! სცადე თავიდან.');
    btn.disabled = false;
    btn.textContent = 'გაგზავნა ✓';
  }
}
 
function resetReview() {
  selectedRest=null; addedDishes=[]; restCriteria={}; selectedCat=null;
  document.querySelectorAll('.rest-card').forEach(c=>c.classList.remove('selected'));
  document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('dish-list').innerHTML='';
  document.getElementById('dish-buttons').innerHTML='';
  document.getElementById('dish-buttons-wrap').classList.add('hidden');
  document.getElementById('rv-next1').disabled=true;
  document.getElementById('rv-next2').disabled=true;
  document.getElementById('rv-next3').disabled=true;
  document.getElementById('rv-next3').textContent='გაგზავნა ✓';
  document.querySelectorAll('.star-r').forEach(s=>s.classList.remove('on'));
  document.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.mini-comment').forEach(t=>t.value='');
  goStep(1);
}
 
/* ══ INIT ══ */
buildRestGrid(); buildCategoryGrid(); buildFoodCatGrid(); buildStarRows(); loadReviews();

/* ══ პროდუქტის მოთხოვნა ══ */
async function submitProductRequest(e) {
  e.preventDefault();
  if (!currentUser) { openLogin(); return; }
  const restName  = document.getElementById('req-rest').value.trim();
  const dishName  = document.getElementById('req-dish').value.trim();
  const comment   = document.getElementById('req-comment').value.trim();
  if (!restName || !dishName) return;
  const btn = document.getElementById('req-submit');
  btn.disabled = true; btn.textContent = '⏳...';
  try {
    await addDoc(collection(db, 'product_requests'), {
      userId:    currentUser.uid,
      userName:  currentUser.displayName,
      userEmail: currentUser.email,
      restName, dishName, comment,
      status:    'pending',
      createdAt: serverTimestamp(),
    });
    document.getElementById('req-form').reset();
    document.getElementById('req-success').classList.remove('hidden');
    setTimeout(() => document.getElementById('req-success').classList.add('hidden'), 4000);
  } catch(err) {
    console.error(err); alert('შეცდომა, სცადე თავიდან');
  }
  btn.disabled = false; btn.textContent = '📩 გაგზავნა';
}
window.submitProductRequest = submitProductRequest;
let restReqCuisine = '';

function selectRestReqCuisine(el, cuisine) {
  restReqCuisine = cuisine;
  document.querySelectorAll('#rest-req-cuisine .pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
}

async function submitRestRequest() {
  if (!currentUser) { openLogin(); return; }
  const name = document.getElementById('rest-req-name').value.trim();
  if (!name) { alert('რესტორნის სახელი შეავსე!'); return; }
  if (!restReqCuisine) { alert('კუზინი აირჩიე!'); return; }
  const btn = document.querySelector('[onclick="submitRestRequest()"]');
  btn.disabled = true; btn.textContent = '⏳...';
  try {
    await addDoc(collection(db, 'product_requests'), {
      userId:    currentUser.uid,
      userName:  currentUser.displayName,
      userEmail: currentUser.email,
      type:      'restaurant',
      restName:  name,
      cuisine:   restReqCuisine,
      status:    'pending',
      createdAt: serverTimestamp(),
    });
    document.getElementById('rest-req-name').value = '';
    restReqCuisine = '';
    document.querySelectorAll('#rest-req-cuisine .pill').forEach(p => p.classList.remove('active'));
    document.getElementById('rest-req-ok').classList.remove('hidden');
    setTimeout(() => document.getElementById('rest-req-ok').classList.add('hidden'), 3000);
  } catch(err) {
    console.error(err); alert('შეცდომა, სცადე თავიდან');
  }
  btn.disabled = false; btn.textContent = '📩 მოთხოვნა';
}

window.submitRestRequest = submitRestRequest;
window.selectRestReqCuisine = selectRestReqCuisine;
async function checkMyRequests() {
  if (!currentUser) return;
  try {
    const q = query(
      collection(db, 'product_requests'),
      where('userId', '==', currentUser.uid),
      where('status', 'in', ['done', 'rejected'])
    );
    const snap = await getDocs(q);
    const newNotifs = snap.docs
      .map(d => ({ docId: d.id, ...d.data() }))
      .filter(r => !r.seenByUser);

    if (!newNotifs.length) return;

    // notification გამოვაჩინოთ
    showRequestNotifications(newNotifs);

    // seenByUser = true დავაყენოთ
    newNotifs.forEach(async r => {
      try {
        await updateDoc(firestoreDoc(db, 'product_requests', r.docId), { seenByUser: true });
      } catch(e) { console.error(e); }
    });
  } catch(e) { console.error(e); }
}

function showRequestNotifications(notifs) {
  const wrap = document.createElement('div');
  wrap.id = 'notif-wrap';
  wrap.style.cssText = `
    position:fixed; bottom:1.5rem; right:1.5rem;
    display:flex; flex-direction:column; gap:0.75rem;
    z-index:9999; max-width:320px;
  `;

  notifs.forEach(r => {
    const isDone = r.status === 'done';
    const card = document.createElement('div');
    card.style.cssText = `
      background:white; border-radius:12px;
      padding:1rem 1.25rem;
      box-shadow:0 8px 32px rgba(0,0,0,0.15);
      border-left:4px solid ${isDone ? '#2e7d32' : '#c62828'};
      font-family:'Noto Sans Georgian',sans-serif;
      animation: slideIn 0.3s ease;
    `;
    const title = isDone ? '✅ მოთხოვნა დამტკიცდა!' : '❌ მოთხოვნა უარყოფილია';
    const color = isDone ? '#2e7d32' : '#c62828';
    const isRest = r.type === 'restaurant';
    const itemName = isRest ? r.restName : r.dishName;
    const itemLabel = isRest ? '🏠 რესტორანი' : '🍽️ კერძი';

    card.innerHTML = `
      <div style="font-weight:700;color:${color};margin-bottom:0.4rem">${title}</div>
      <div style="font-size:0.85rem;color:#333">
        ${itemLabel}: <b>${itemName}</b>
      </div>
      <button onclick="this.parentNode.parentNode.removeChild(this.parentNode)"
        style="margin-top:0.5rem;background:none;border:none;cursor:pointer;
        font-size:0.75rem;color:#999;font-family:'Noto Sans Georgian',sans-serif">
        დახურვა ✕
      </button>
    `;
    wrap.appendChild(card);
  });

  document.body.appendChild(wrap);  
}
/* გლობალური */


window.handleAuth=handleAuth; window.requireAuth=requireAuth;
window.signInGoogle=signInGoogle; window.closeLogin=closeLogin;
window.showPage=showPage; window.goHome=goHome; window.setSearchMode=setSearchMode;
window.filterByChip=filterByChip; window.filterFoodResults=filterFoodResults;
window.toggleFoodCat=toggleFoodCat; window.selectFoodDish=selectFoodDish; window.setSortFood=setSortFood;
window.filterRestResults=filterRestResults; window.setSortRest=setSortRest;
window.selectRestCard=selectRestCard; window.filterRestCards=filterRestCards;
window.selectCategory=selectCategory; window.filterDishButtons=filterDishButtons;
window.setDishStar=setDishStar; window.removeDish=removeDish;
window.setStarField=setStarField; window.selectPill=selectPill;
window.goStep=goStep; window.submitReview=submitReview; window.resetReview=resetReview;
window.requireAuthFavs=requireAuthFavs; window.toggleFav=toggleFav; window.toggleComments=toggleComments;
