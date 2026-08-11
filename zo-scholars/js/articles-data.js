/* ===========================================================================
   ARTICLES & SHARING DATA — this is the file where you write articles.
   ---------------------------------------------------------------------------
   Copy one block between { } and change the text. Keep the commas.

   date         "YYYY-MM-DD"
   label        "Sharing" or "Article"
   title        The title of the column
   author       Name of the author (optional)
   content      An array of paragraph strings or HTML blocks
   =========================================================================== */

const ZO_ARTICLES = [
  {
    id: "entropy",
    date: "2026-08-11",
    label: "Article",
    title: "Entropy bih chianna",
    author: "Lalhminghlui (PhD Mechanical Engineering, Indian Institute of Science)",
    pdfUrl: "ENTROPY.pdf",
    content: [
      "Entropy hi eng tak nge a nih? class 11 science a kan entropy zir kha kan zawi fiah anga, a concept thuk zia leh a mathematics kimchangin ngaihtuah ho ila ..."
    ]
  },
  {
    id: "ml-biophysics",
    date: "2026-08-11",
    label: "Video",
    title: "Machine Learning Biophysics a hmanna (Alpha Fold )",
    videoUrl: "https://youtu.be/cCBi4ZueOrw"
  },
  {
    id: "general-relativity",
    date: "2026-08-10",
    label: "Video",
    title: "General Relativity tutorial Mizo tawngin",
    author: "R. Lallawmsanga (B.S physics IISc)",
    videoUrl: "https://www.youtube.com/watch?v=4aN9b0CvtMM&t=4s"
  },
  {
    id: "h-index",
    date: "2026-08-03",
    label: "Sharing",
    title: "H-Index hi a pawimawh ber em?",
    author: "Samuel Zomawia Khiangte",
    content: [
      "Researcher tin tan H-Index leh citation number hi kan google scholar page ah a in tar thin a, kan hre tawh awm e. Reseacher nih chuan engtin nge kan research hian mi a puih tih kan hre duh thin a, kan research hi miin tha a ti em tih kan hre duh thin. Hemi atan hian kan article hi mi engzatin nge cite tih hi researcher tin chuan kan ngaihven thin a, amaherawhchu citation number ringawt en hian a famkim lo thin. Entir nan, paper 10 nei ta ila, ka paper tinah ka paper hlui zawng zawng kha keiman lo cite ta ila, a total in 9+8+7…=45 citations kha tuman min cite lovin keimah chauh in ka in cite khan ka nei dawn der tihna a nih chu!",
      "Hemi tan hian Jorge E. Hirscha, UC San Diego a physicist chuan H-Index hi alo siam chhuak a. H-Index hian kan paper neih ang zat zelah, citation engzat nge a neih ti a sawi a ni. Entir nan, H-Index 10 chuan, ka paper 10 khan citation 10 theuh a nei tihna a ni.",
      "<strong>H-Index sang hi researcher tha tihna a nimai em?</strong>",
      "Indian Institute of Science ah ka PhD advisor-in an experience min share ka lo share ve anga. Ka advisor in IISc a hna a dil dawn khan, a hna dil pui te zingah a H-Index a hniam ber a, candidate an thlit fim hnu a, mi pahnih chauh an awm hnuah pawh, a elpui researcher dang, IISc a hna zawng ve chuan amah aiin let 3 velin a H-Index a sang zawk hial a ni. Amaherawhchu ka advisor khan a paper ziah tam takah khan award te, journal cover te, editor suggestion te a lo dawng tawh a, paper ngah lo ta, citation ngah viau lo pawh khan IISc ah Assistant Professor turin an la a ni. A hnuah a thawhpuite hnenah, “Tinge keimah kha min lak zawk?” tih kha a zawt a; a chhan ber chu a paper neih chhun khan award a dawn nual bakah, amah chauha a research paper ziah pakhat (single author paper) physics a journal tha bera ngaih, Physical Review X ah a publish theih vang khan an la niin a sawi. H-Index te hi a pawimawh a, mahse engkim a ni lo. Kan research tih a quality chuan a hrethiam tur chuan an hrethiam mai ang tiin min hrilh thin a ni."
    ]
  }
];
