/* ============================================================
   DreamWings — Bilingual engine (English default / Arabic)
   - One central dictionary for every page
   - Persists the choice in localStorage (key: dreamwings:lang)
   - Switches <html lang> + dir="rtl" for Arabic
   - Styled EN / AR switch (only rendered where enabled)
   ============================================================ */

const LANG_KEY = "dw_lang";
const LEGACY_LANG_KEYS = ["dreamwings:lang"];
const SUPPORTED = ["en", "ar"];

function readStoredLang() {
  try {
    const primary = localStorage.getItem(LANG_KEY);
    if (primary) return primary.toLowerCase();
    for (const key of LEGACY_LANG_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy) {
        localStorage.setItem(LANG_KEY, legacy.toLowerCase());
        return legacy.toLowerCase();
      }
    }
    return "en";
  } catch { return "en"; }
}
function storeLang(value) {
  try {
    localStorage.setItem(LANG_KEY, value);
    LEGACY_LANG_KEYS.forEach(key => localStorage.setItem(key, value));
  } catch { /* private mode */ }
}

let lang = readStoredLang();
if (!SUPPORTED.includes(lang)) lang = "en";

/* ---------- English -> Arabic ---------- */
const TO_AR = {
  /* --- page titles --- */
  "DreamWings | Magic Children Stories": "دريم وينجز | قصص أطفال سحرية",
  "DreamWings | My Profile": "دريم وينجز | ملفي الشخصي",
  "DreamWings | Magic Library Categories": "دريم وينجز | أقسام المكتبة السحرية",
  "DreamWings | Little Artists Gallery": "دريم وينجز | معرض الفنانين الصغار",
  "DreamWings | Monthly Book Club": "دريم وينجز | نادي القراءة الشهري",
  "DreamWings | Reading Certificate of Achievement": "دريم وينجز | شهادة إنجاز القراءة",
  "DreamWings | About Me & My Art": "دريم وينجز | عن الكاتبة وفنّي",
  "DreamWings | Contact Us": "دريم وينجز | تواصل معنا",
  "DreamWings | My Favorite Stories": "دريم وينجز | قصصي المفضلة",
  "DreamWings | Sign In": "دريم وينجز | تسجيل الدخول",
  "DreamWings | Create Account": "دريم وينجز | إنشاء حساب",
  "DreamWings | Book Studio": "دريم وينجز | استوديو الكتب",
  "DreamWings | Fantasy & Bedtime Stories": "دريم وينجز | قصص خيالية ووقت النوم",
  "DreamWings | Category": "دريم وينجز | أقسام القصص",
  "DreamWings | Storybook": "دريم وينجز | كتاب القصص",
  "DreamWings": "دريم وينجز",

  /* --- navigation / shared --- */
  "Home": "الرئيسية",
  "Library": "المكتبة",
  "Gallery": "معرض الرسوم",
  "Book Club": "نادي القراءة",
  "About Me": "عن الكاتبة",
  "Contact Us": "تواصل معنا",
  "Sign In": "تسجيل الدخول",
  "Sign Out": "تسجيل الخروج",
  "Profile": "ملفي الشخصي",
  "Favorites": "المفضلة",
  "Add to Favorites": "إضافة إلى المفضلة",
  "Remove from Favorites": "إزالة من المفضلة",
  "Quick Links": "روابط سريعة",
  "Connect": "تواصلوا معنا",
  "Magical stories narrated with love to inspire young hearts and minds.":
    "قصص سحرية تُروى بكل حب ودفء لتُلهم القلوب والعقول الصغيرة.",
  "© 2026 DreamWings. All rights reserved. Designed with 🧡 by Hind.":
    "© 2026 DreamWings. جميع الحقوق محفوظة. صُمم بكل 🧡 بواسطة هند.",

  /* --- home --- */
  "Magic Children Stories": "قصص سحرية للأطفال",
  "⭐ Interactive Story Library": "⭐ مكتبة القصص التفاعلية",
  "Where Stories Fly & Dreams Begin": "حيث تُحلّق القصص وتبدأ الأحلام",
  "Step into a magical world of tales narrated with love and warmth for young curious minds.":
    "ادخلوا إلى عالم سحري من الحكايات المروية بكل حب ودفء لعقول صغارنا الفضولية.",
  "Explore The Library": "استكشف المكتبة",
  "DreamWings Girl Character": "شخصية دريم وينجز السحرية",
  "🎙️ Narrated by Hind": "🎙️ بصوت الكاتبة هند",
  "A Warm Hello to Little Adventurers!": "أهلاً بمغامرينا الصغار والأبطال!",
  "Welcome to": "أهلاً بكم في",
  ". Every story here is crafted to inspire kindness, creativity, and wonder. Hit the play button to hear my personal welcome message!":
    ". صُممت كل حكاية هنا لتُلهم الطيبة والإبداع والدهشة في قلوبكم. اضغطوا زر التشغيل للاستماع إلى رسالتي الترحيبية!",
  "How DreamWings Works": "كيف يعمل دريم وينجز؟",
  "A simple and magical journey for parents and children": "رحلة بسيطة وممتعة وساحرة للأطفال وعائلاتهم",
  "Choose a Story": "اختر قصة مشوقة",
  "Browse our library filled with wonderful, hand-picked illustrated tales.":
    "تصفّح مكتبتنا المليئة بحكايات مصوّرة ساحرة ومختارة بعناية.",
  "Listen & Read": "استمع واقرأ",
  "Enjoy immersive reading combined with professional heartfelt voice narration.":
    "استمتع بقراءة تفاعلية مبهجة مصحوبة بسرد صوتي دافئ من القلب.",
  "Share the Joy": "شارك الفرحة",
  "Save your favorite stories and create unforgettable bonding bedtime moments.":
    "احفظ قصصك المفضلة واصنع لحظات دافئة لا تُنسى قبل النوم.",

  /* --- library --- */
  "Magic Library Categories": "أقسام المكتبة السحرية",
  "Magic Story Categories": "أقسام القصص السحرية",
  "Explore Our Library Shelves": "استكشفي رفوف مكتبتنا",
  "Choose a category below to discover wonderful tales and magical adventures!":
    "اختاري قسماً بالأسفل لتكتشفي حكايات رائعة ومغامرات سحرية!",
  "Fantasy & Sci-Fi Tales": "حكايات الخيال والعلوم",
  "Space & Stars": "الفضاء والنجوم",
  "Sci-Fi Adventures": "مغامرات علمية",
  "Popular": "شائع",
  "Secret Kingdoms": "الممالك السرية",
  "Fantasy Worlds": "عوالم خيالية",
  "Magical": "سحري",
  "Time Portals": "بوابات الزمن",
  "Sci-Fi Wonders": "عجائب علمية",
  "Exciting": "مشوّق",
  "Educational & Values": "تعليمي وقيمي",
  "Kind Hearts": "قلوب طيبة",
  "Islamic & Moral": "إسلامي وأخلاقي",
  "Values": "قيم",
  "Little Scientist": "العالم الصغير",
  "Educational Fun": "تعلّم ممتع",
  "Learn": "تعلّم",
  "Sleepy Star Dreams": "أحلام النجمة الناعسة",
  "Calm Bedtime": "نوم هادئ",
  "Bedtime": "وقت النوم",

  /* --- about --- */
  "About Me & My Art": "عنّي وفنّي",
  "Meet The Creator": "تعرّفي على المبدعة",
  "Hello, I'm Hind! 🧡": "مرحباً، أنا هند! 🧡",
  "Software Engineer, UI/UX Designer, and passionate artist behind DreamWings.":
    "مهندسة برمجيات ومصممة واجهات وفنانة شغوفة، وراء دريم وينجز.",
  "My Creative Journey": "رحلتي الإبداعية",
  "Welcome to my magical corner! I'm": "مرحباً بك في رُكني السحري! أنا",
  ", a Computer Science graduate specializing in Software Engineering, with a deep passion for UI/UX design and digital/traditional art.":
    "، خريجة علوم حاسب تخصص هندسة برمجيات، ولديّ شغف عميق بتصميم واجهات المستخدم والفن الرقمي والتقليدي.",
  "Art has always been my way of expressing emotions and capturing details—from realistic pencil sketching and cross-hatching to digital illustration.":
    "كان الفن دائماً طريقي للتعبير عن المشاعر وتوثيق التفاصيل — من الرسم الواقعي بالقلم والتظليل المتقاطع إلى الرسم الرقمي.",
  "is a reflection of my love for warmth, storytelling, and magical aesthetics, built to inspire young hearts and minds.":
    "هو انعكاس لحبي للدفء والحكايات والجمال السحري، صُنع ليُلهم القلوب والعقول الصغيرة.",
  "My Sketchbook & Art Studies": "دفتر رسوماتي ودراساتي الفنية",
  "A glimpse into my traditional sketching, realistic portraits, and detailed pencil studies.":
    "لمحة عن رسمي التقليدي والبورتريهات الواقعية ودراسات القلم المفصّلة.",
  "Zootopia Characters Study": "دراسة شخصيات زوتوبيا",
  "Portrait & Hair Details": "تفاصيل البورتريه والشعر",
  "Cozy Room & Story Vibes": "غرفة دافئة وأجواء قصصية",
  "Floral Portrait & Freckles": "بورتريه زهري ونمش",
  "Leave a Note or Rating": "اتركي ملاحظة أو تقييماً",
  "Did you like DreamWings and my art? Drop a comment or leave a star rating!":
    "هل أعجبك دريم وينجز وفنّي؟ اتركي تعليقاً أو تقييماً بالنجوم!",
  "Your Rating:": "تقييمك:",
  "Submit Comment": "أرسلي التعليق",
  "Visitor Notes": "ملاحظات الزوّار",
  "Write your sweet note or feedback here...": "اكتبي ملاحظتك أو رأيك اللطيف هنا...",
  "Your Name": "اسمك",
  "Zootopia Portrait": "بورتريه زوتوبيا",
  "Portrait Shading": "تظليل البورتريه",
  "Cozy Room Illustration": "رسمة الغرفة الدافئة",
  "Floral Portrait": "بورتريه زهري",
  "Hind - DreamWings Creator": "هند - مبدعة دريم وينجز",

  /* --- contact --- */
  "Get In Touch": "تواصلي معنا",
  "Send Us a Magical Note 💌": "أرسلي لنا رسالة سحرية 💌",
  "Have a question, feedback, or just want to say hi? We'd love to hear from you!":
    "عندك سؤال أو ملاحظة أو حتى تحية؟ يسعدنا أن نسمع منك!",
  "Direct Email": "البريد المباشر",
  "Creative Studio": "استوديو الإبداع",
  "Designed & Created with Love in Egypt 🧡": "صُمم وأُبدع بحب في مصر 🧡",
  "Follow My Art": "تابعي فنّي",
  "Write a Message": "اكتبي رسالة",
  "Send Message": "أرسلي الرسالة",
  "Your Email Address": "بريدك الإلكتروني",
  "Subject (e.g. Story Feedback, Inquiry)": "الموضوع (مثال: رأي في قصة، استفسار)",
  "Write your magical note here...": "اكتبي رسالتك السحرية هنا...",

  /* --- auth --- */
  "Back to Home": "العودة للرئيسية",
  "Welcome Back! 🌟": "مرحباً بعودتك! 🌟",
  "Log in to continue your magical reading journey.": "سجّلي الدخول لمتابعة رحلة القراءة السحرية.",
  "Sign in with Google": "الدخول باستخدام Google",
  "Don't have an account?": "ليس لديك حساب؟",
  "Create one": "أنشئي حساباً",
  "Create Account": "إنشاء حساب",
  "Join DreamWings! 🧡": "انضمي إلى دريم وينجز! 🧡",
  "Create an account to explore magical tales and save favorites.":
    "أنشئي حساباً لتستكشفي الحكايات السحرية وتحفظي المفضلة.",
  "Already have an account?": "لديك حساب بالفعل؟",
  "Email Address": "البريد الإلكتروني",
  "Password": "كلمة المرور",
  "Create Password": "أنشئي كلمة المرور",
  "Full Name": "الاسم الكامل",

  /* --- profile --- */
  "My Profile": "ملفي الشخصي",
  "Master Story Explorer": "مستكشف الحكايات الماهر",
  "Stories Read": "قصص قرأتها",
  "Favorite Books": "قصصي المفضلة",
  "Listening Time": "وقت الاستماع",
  "Personalize your profile": "تخصيص ملفك الشخصي",
  "Choose Your Magical Picture": "اختر صورتك الجميلة",
  "Choose a JPG, PNG, or WebP image (up to 5 MB).": "اختر صورة بصيغة JPG أو PNG أو WebP (حتى 5 ميجابايت).",
  "Or choose a magical avatar": "أو اختر شخصيتك السحرية المفضلة",
  "My Saved Favorites": "قصصي المفضلة المحفوظة ⭐",
  "Add a Book / Book Studio": "إضافة قصة / استوديو الكتب",
  "For the site owner: add stories, cover images, illustrations, audio and optional video.":
    "خاص بإدارة المنصة: إضافة قصص جديدة، وتصميم الأغلفة، والرسومات، والتسجيلات الصوتية.",
  "Profile picture": "صورة الملف الشخصي",
  "mins": "دقيقة",
  "0 mins": "0 دقيقة",
  "Welcome, Hind! 🧡": "مرحباً، هند! 🧡",
  "hours": "ساعة",
  "Welcome, {name}! 🧡": "مرحباً، {name}! 🧡",
  "Reader": "يا بطل القراءة",

  /* --- badges & rewards --- */
  "Magical Badges & Achievements": "شارات وإنجازات دريم وينجز السحرية",
  "Read stories, listen to wonderful adventures, and unlock magical badges for your journey!":
    "اقرأ القصص، واستمع للمغامرات الساحرة، واجمع شاراتك السحرية المميزة!",
  "{unlocked} / {total} Unlocked": "{unlocked} من {total} شارات مكتسبة",
  "Unlocked ✨": "تم الإنجاز ✨",
  "In Progress": "قيد الإنجاز",
  "Story Explorer": "مستكشف الحكايات",
  "Space Explorer": "مكتشف الفضاء",
  "Magic Storyteller": "ساحر الحكايات",
  "Reader of the Week": "قارئ الأسبوع",
  "Attentive Listener": "المستمع الصغير",
  "Bedtime Hero": "بطل حكايات النوم",
  "Audio Adventurer": "مغامر الأصوات الذهبي",
  "Story Collector": "جامع الحكايات",
  "Read your first magical story": "اقرأ أول قصة سحرية لك في دريم وينجز",
  "Read 3 stories in the library": "اقرأ 3 قصص وانطلق في رحلة بين النجوم",
  "Read 5 magical stories": "اقرأ 5 قصص سحرية واكتشف أسرار الممالك",
  "Read 10 stories across DreamWings": "اقرأ 10 قصص لتصبح بطل القراءة المتوج",
  "Listen to 5 minutes of narration": "استمع إلى 5 دقائق من السرد الصوتي الدافئ",
  "Listen to 15 minutes of bedtime stories": "استمع إلى 15 دقيقة من قصص النوم الهادئة",
  "Listen to 30 minutes of voice narration": "استمع إلى 30 دقيقة من السرد الصوتي الممتع",
  "Save 3 stories to your favorites": "احفظ 3 قصص مفضلة في مكتبتك السحرية",
  "🎉 New Badge Unlocked: {name}! ✨": "🎉 مبارك يا بطل! تم فتح شارة: {name}! ✨",

  /* --- favorites page --- */
  "My Favorite Stories": "قصصي المفضلة",
  "Magical Collection": "مجموعة سحرية",
  "My Favorite Stories ⭐": "قصصي المفضلة ⭐",
  "All the magical tales you loved and saved in one cozy place.":
    "كل الحكايات السحرية التي أحببتها وحفظتها في مكان دافئ واحد.",
  "Saved Tales": "حكايات محفوظة",
  "Please sign in to view your saved stories.": "يرجى تسجيل الدخول لعرض قصصك المفضلة المحفوظة.",
  "No favorites yet. Open a story and tap the star to save it.":
    "لا توجد قصص مفضلة حتى الآن. افتح أي قصة واضغط على النجمة الذهبية لحفظها هنا! ⭐",

  /* --- reader --- */
  "Storybook": "كتاب القصص",
  "Back to Library": "العودة للمكتبة",
  "A MAGICAL READING JOURNEY": "رحلة قراءة سحرية",
  "Your Storybook": "كتاب قصتك الساحر",
  "Turn the pages and let your imagination fly ✨": "اقلبوا الصفحات ودعوا خيالكم يُحلّق في السماء ✨",
  "Opening your magical book…": "نفتح كتابكم السحري الآن…",
  "Your story illustration will appear here": "ستظهر رسمة القصة الجميلة هنا",
  "Open book": "افتح الكتاب",
  "Previous": "السابق",
  "Next": "التالي",
  "Play my audio": "استمع للسرد الصوتي",
  "Pause": "إيقاف مؤقت",
  "Watch the story": "مشاهدة فيديو القصة",
  "Cover": "الغلاف",
  "A story by {author}": "قصة بقلم: {author}",
  "A DreamWings story": "إحدى روائع دريم وينجز",
  "Untitled Story": "قصة بلا عنوان",
  "✨ DreamWings Story ✨": "✨ إحدى حكايات دريم وينجز ✨",
  "Story Title": "عنوان القصة",
  "✨ Turning the cover... Welcome to your story! ✨": "✨ نفتح الغلاف السحري... أهلاً بك في عالم الحكاية! ✨",
  "Your story has begun. Enjoy reading! ✨": "بدأت الحكاية الجميلة... استمتع بالقراءة! ✨",
  "Take Magic Quiz! ⭐": "اختبر ذكاءك السحري! ⭐",
  "Question": "السؤال",
  "of": "من",
  "Magical Excellence Star! ⭐": "نجمة التميز السحري! ⭐",
  "Claim My Star! ✨": "احصل على نجمتك! ✨",
  "⭐ Magical Excellence Star awarded! Keep shining! ✨": "⭐ تم منحك نجمة التميز السحري! استمر في التألق! ✨",
  "Page": "صفحة",
  "Found {count} story shelves matching your search ✨": "تم العثور على {count} رفوف قصص تطابق بحثك ✨",
  "🎙️ Listening... Tell us what story you want to read!": "🎙️ نستمع إليك... أخبرنا ما هي القصة التي تريد قراءتها!",

  /* --- category --- */
  "Category": "قسم",
  "Back to Categories": "العودة للأقسام",
  "Magical Story Collection": "مجموعة القصص السحرية",
  "Stories": "قصص",
  "Choose a book and step into a new adventure ✨": "اختاري كتاباً وابدئي مغامرة جديدة ✨",
  "Stories on this Shelf": "قصص على هذا الرف",
  "Loading stories…": "جارٍ تحميل القصص…",
  "No stories have been added to this shelf yet. Add one from Book Studio ✨":
    "لم تُضف قصص لهذا الرف بعد. أضيفي قصة من استوديو الكتب ✨",
  "This category could not be found.": "لم نتمكّن من العثور على هذا القسم.",
  "Could not load books. Please check Firestore permissions and refresh.":
    "تعذّر تحميل الكتب. تحقّقي من صلاحيات Firestore وأعيدي التحديث.",
  "New magical stories will appear here soon ✨": "ستظهر قصص سحرية جديدة هنا قريباً ✨",
  "We couldn't load the stories. Please refresh and try again.":
    "تعذّر تحميل القصص. أعيدي التحديث وحاولي مرة أخرى.",
  "Edit": "تعديل",
  "Delete": "حذف",

  /* --- category-fantasy --- */
  "Fantasy & Bedtime Stories": "قصص خيالية ووقت النوم",
  "Fantasy & Magical Tales": "حكايات خيالية وسحرية",
  "Magical Bedtime Collection": "مجموعة وقت النوم السحرية",
  "Click on any book cover to start reading or listening to the narrated audio!":
    "اضغطي على أي غلاف لتبدئي القراءة أو الاستماع للسرد الصوتي!",
  "Dreams & Adventures": "أحلام ومغامرات",
  "Moonlight & Wonders": "ضياء القمر وعجائب",
  "Featured Story": "قصة مختارة",
  "Story Title": "عنوان القصة",
  "Written by:": "بقلم:",
  "Story description goes here...": "وصف القصة يظهر هنا...",
  "Your story is ready. Press “Listen & Read” to hear the story read aloud.":
    "قصتك جاهزة. اضغطي «اسمعي واقرئي» لسماع القصة بصوت عالٍ.",
  "Read & Listen": "اقرئي واسمعي",
  "Choose how you would like to enjoy this story.": "اختاري كيف تحبين الاستمتاع بهذه القصة.",
  "Read aloud": "قراءة بصوت عالٍ",
  "Stop": "إيقاف",
  "Open / download book file": "افتحي / نزّلي ملف الكتاب",
  "Book Cover": "غلاف الكتاب",
  "Book cover": "غلاف الكتاب",
  "Book document": "ملف الكتاب",

  /* --- book studio --- */
  "Book Studio": "استوديو الكتب",
  "Back to Profile": "العودة للملف الشخصي",
  "Add your story as text, choose its illustrations one by one, and optionally add your own narration audio. Uploaded stories appear in the Fantasy collection.":
    "أضيفي قصتك كنص، واختاري رسومها واحدة تلو الأخرى، وأضيفي سردك الصوتي إن أردت. تظهر القصص المرفوعة في مجموعة الخيال.",
  "Book title": "عنوان الكتاب",
  "Author": "المؤلف",
  "Short description": "وصف قصير",
  "Choose a category": "اختاري قسماً",
  "Add new category": "أضيفي قسماً جديداً",
  "New category name": "اسم القسم الجديد",
  "Story text (required – paste or type the complete story here)":
    "نص القصة (مطلوب – الصقي أو اكتبي القصة كاملة هنا)",
  "Book cover image (JPG / PNG)": "غلاف الكتاب (JPG / PNG)",
  "Story illustrations (optional – add images one at a time, in story order)":
    "رسوم القصة (اختياري – أضيفي صورة واحدة في كل مرة وبترتيب القصة)",
  "Press “Add another image” after each selection. Image 1 appears beside story page 1, image 2 beside page 2, and so on.":
    "اضغطي «أضيفي صورة أخرى» بعد كل اختيار. الصورة 1 تظهر بجانب الصفحة 1، والصورة 2 بجانب الصفحة 2، وهكذا.",
  "Your own narration audio (MP3 / M4A / WAV) – optional; no default sound is played":
    "سردك الصوتي (MP3 / M4A / WAV) – اختياري؛ لا يُشغَّل أي صوت افتراضي",
  "Story video (optional – appears below the book for visitors who prefer watching)":
    "فيديو القصة (اختياري – يظهر أسفل الكتاب لمن يفضل المشاهدة)",
  "Upload book": "ارفعي الكتاب",
  "Write or paste your complete story here. It will be divided into animated book pages…":
    "اكتبي أو الصقي قصتك كاملة هنا. ستُقسَّم إلى صفحات كتاب متحركة…",
  "Access Restricted": "الوصول مقيّد",
  "Sign in with the site-owner account.": "سجّلي الدخول بحساب مالكة الموقع.",

  /* --- dynamic JS strings --- */
  "Please sign in to view your saved stories.": "سجّلي الدخول لعرض قصصك المحفوظة.",
  "Sign in to save this story to your personal Favorites.":
    "سجّلي الدخول لحفظ هذه القصة في مفضلتك.",
  "Added to your Favorites ⭐": "أُضيفت إلى مفضلتك ⭐",
  "Removed from your Favorites.": "أُزيلت من مفضلتك.",
  "All set!": "تم بنجاح!",
  "Something went wrong": "حدث خطأ ما",
  "A quick note": "ملاحظة سريعة",
  "Just so you know": "للعلم فقط",
  "Please enter your email and password.": "أدخلي بريدك الإلكتروني وكلمة المرور.",
  "Incorrect email or password.": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "Too many attempts. Please try again later.": "محاولات كثيرة. حاولي لاحقاً.",
  "Login failed. Please try again.": "فشل تسجيل الدخول. حاولي مرة أخرى.",
  "Please verify your email first. We sent you a new verification link.":
    "يرجى تأكيد بريدك أولاً. أرسلنا لك رابط تأكيد جديد.",
  "Welcome back! Your reading adventure is ready.": "مرحباً بعودتك! مغامرتك القرائية جاهزة الآن 🌟",
  "Welcome to DreamWings": "أهلاً بكم في دريم وينجز",
  "You're in!": "تم الدخول بنجاح!",
  "Saving your profile...": "جارٍ حفظ ملفك السحري...",
  "Your profile has been saved successfully ✨": "تم حفظ ملفك الشخصي بنجاح ✨",
  "Couldn't save your profile. Please try again.": "تعذّر حفظ التعديلات. يرجى المحاولة مرة أخرى.",
  "Preparing your picture...": "جارٍ تجهيز صورتك الرائعة...",
  "Playback started.": "بدأ التشغيل.",
  "Narration paused.": "تم إيقاف السرد مؤقتاً.",
  "Narration finished.": "انتهى السرد.",
  "Your story has begun. Enjoy reading! ✨": "بدأت قصتك. استمتع بالقراءة الساحرة! ✨",
  "See you soon!": "إلى اللقاء قريباً!",
  "🎧 Playing Hind's Welcome Voice Note... (Voice player is ready to link your audio file!)":
    "🎧 نستمع الآن إلى رسالة الترحيب الدافئة من هند... (المشغّل جاهز لتشغيل ملفك الصوتي!)",
  "We could not sign you out. Please try again.": "تعذّر تسجيل خروجك. يرجى المحاولة مرة أخرى.",

  /* ============================================================
     ✨ v10 — shared UI, smart search, magical reader
     ============================================================ */
  "Language": "اللغة",
  "Close": "إغلاق",
  "Cancel": "إلغاء",
  "Save": "حفظ",
  "Saving…": "جارٍ الحفظ…",
  "Loading…": "جارٍ التحميل…",
  "Try again": "حاول مرة أخرى",
  "Optional": "اختياري",
  "Required": "مطلوب",
  "Yes": "نعم",
  "No": "لا",
  "New": "جديد",
  "Featured": "مميز",
  "Admin": "الإدارة",
  "Back to site": "العودة للموقع",
  "Signed in as": "مسجل الدخول باسم",
  "Something went wrong. Please try again.": "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
  "Please sign in to continue.": "يرجى تسجيل الدخول للمتابعة.",
  "This field is required.": "هذا الحقل مطلوب.",
  "Read now": "اقرأ الآن",
  "Open": "افتح",
  "Preview": "معاينة",
  "Copy": "نسخ",
  "Copied": "تم النسخ",
  "Delete": "حذف",
  "Edit": "تعديل",
  "Back": "رجوع",
  "Next": "التالي",
  "Previous": "السابق",

  /* --- smart library search --- */
  "Search stories, genres, animals, space, adventures...": "ابحث عن قصص، أقسام، حيوانات، فضاء، مغامرات...",
  "Search stories": "ابحث عن القصص",
  "Clear Search": "مسح البحث",
  "Voice Search": "البحث الصوتي",
  "All Stories": "كل القصص",
  "Bedtime Dreams": "أحلام النوم",
  "Cute Animals": "حيوانات لطيفة",
  "Search Results": "نتائج البحث",
  "Stories matching your search": "قصص تطابق بحثك",
  "No Stories Found": "لم نجد قصصاً",
  "Try searching for other words like “space”, “stars”, “animals”, or click “All Stories”!": "جرّب البحث بكلمات أخرى مثل «فضاء» أو «نجوم» أو «حيوانات»، أو اضغط «كل القصص»!",
  "Searching the magic shelves…": "نبحث في الرفوف السحرية…",
  "Showing {count} stories for “{query}”": "عرض {count} قصة لـ «{query}»",
  "{count} magical stories found ✨": "تم العثور على {count} قصة سحرية ✨",
  "Clear filters": "إزالة الفلاتر",
  "Voice search is supported on Chrome and mobile browsers with microphone enabled ✨": "البحث الصوتي مدعوم في Chrome ومتصفحات الهاتف مع تفعيل الميكروفون ✨",
  "Search by title, author, or a magic word like “space” or “حيوانات”.": "ابحث بالعنوان أو المؤلف أو كلمة سحرية مثل «فضاء» أو «animals».",
  "Browse by genre": "تصفّح حسب النوع",
  "Popular searches": "بحث شائع",
  "Animals": "حيوانات",
  "Space": "فضاء",
  "Adventure": "مغامرة",
  "Kindness": "طيبة",
  "Bedtime": "وقت النوم",
  "Magic": "سحر",
  "Science": "علوم",
  "Time travel": "السفر بالزمن",

  /* --- magical reader --- */
  "Open Book": "افتح الكتاب",
  "Tap to open your magical storybook": "اضغط لفتح كتابك السحري",
  "Opening the cover…": "نفتح الغلاف السحري…",
  "Story pages": "صفحات القصة",
  "Page {current} of {total}": "صفحة {current} من {total}",
  "Story illustration": "رسمة القصة",
  "You finished the story! 🎉": "أنهيت القصة! 🎉",
  "Finish & take the quiz": "أنهِ القصة وابدأ الاختبار",
  "Take the Magic Quiz": "ابدأ الاختبار السحري",
  "Take the Magic Quiz!": "ابدأ الاختبار السحري!",
  "Answer 3 gentle questions to earn your Magical Excellence Star.": "أجب عن 3 أسئلة لطيفة لتحصل على نجمة التميز السحري.",
  "Question {current} of {total}": "السؤال {current} من {total}",
  "Correct! ✨": "إجابة صحيحة! ✨",
  "Almost! Try again 💛": "قريب جداً! حاول مرة أخرى 💛",
  "Congratulations! You answered all questions with flying colors! Your Magical Excellence Star has been added to your profile journey!": "مبروك! أجبت عن كل الأسئلة بامتياز! أُضيفت نجمة التميز السحري إلى رحلة ملفك الشخصي!",
  "Read again": "اقرأ مرة أخرى",
  "Next story": "القصة التالية",
  "Your browser does not support narration playback.": "متصفحك لا يدعم تشغيل السرد الصوتي.",
  "Playing the narration uploaded for this book.": "نشغّل الآن السرد الصوتي المرفق بهذا الكتاب.",
  "Couldn't play the uploaded audio. Check the audio file URL.": "تعذّر تشغيل الملف الصوتي. تحقّق من رابط الملف.",
  "The uploaded audio file could not be loaded.": "تعذّر تحميل الملف الصوتي المرفق.",
  "This book has no text story yet. The owner can add it from Edit in the Fantasy collection or Book Studio.": "لا يحتوي هذا الكتاب على نص قصصي بعد. يمكن للمبدعة إضافته من لوحة التحكم.",
  "No story was selected.": "لم يتم اختيار قصة.",
  "This book could not be found.": "لم نتمكن من العثور على هذا الكتاب.",
  "Could not load this story. Please try again.": "تعذّر تحميل هذه القصة. يرجى المحاولة مرة أخرى.",
  "Back to Cover": "العودة للغلاف",
  "Story progress": "تقدم القصة",
  "Open your book": "افتح كتابك",
  "One tap opens the magic": "لمسة واحدة تفتح السحر",
  "A story for you": "قصة من أجلك",
  "Written with love": "مكتوبة بكل حب",

  /* --- little artists gallery --- */
  "Little Artists Gallery": "معرض الفنانين الصغار",
  "Little Artists Gallery 🎨": "معرض الفنانين الصغار 🎨",
  "Young Artists Community": "مجتمع الفنانين الصغار",
  "A magical space celebrating our young readers' creative drawings and imagination!": "مساحة سحرية نحتفي فيها برسومات قرّائنا الصغار وخيالهم الجميل!",
  "Submit Your Child's Drawing": "أرسل رسمة طفلك",
  "Submit a Drawing": "أرسل رسمة",
  "Parents: share your little adventurer's creative drawings to be proudly showcased in our community gallery!": "أولياء الأمور: شاركوا رسومات صغاركم الإبداعية لنعرضها بكل فخر في معرض مجتمعنا!",
  "Child's Name": "اسم الطفل",
  "Child's Age": "عمر الطفل",
  "Story that Inspired it": "القصة التي ألهمت الرسمة",
  "Drawing Picture": "صورة الرسمة",
  "Send to DreamWings": "أرسل إلى دريم وينجز",
  "Shared with love 🧡": "مشاركة بحب 🧡",
  "Zoom": "تكبير",
  "years old": "سنوات",
  "Years Old": "سنوات",
  "Your drawing is on its way! We will review it and add it to the gallery soon ✨": "رسمتك في الطريق إلينا! سنراجعها ونضيفها إلى المعرض قريباً ✨",
  "Please choose a drawing image (JPG, PNG or WebP up to 8 MB).": "يرجى اختيار صورة الرسمة (JPG أو PNG أو WebP حتى 8 ميغابايت).",
  "Thank you! Your child's drawing has been received with love! ✨": "شكراً لكم! وصلتنا رسمة طفلكم بكل حب! ✨",
  "⭐ You gave a magical star to this young artist! ✨": "⭐ منحت نجمة سحرية لهذا الفنان الصغير! ✨",
  "Gallery is loading…": "جارٍ تحميل المعرض…",
  "No drawings yet — be the first little artist! 🎨": "لا توجد رسومات بعد — كن أول فنان صغير! 🎨",
  "Drawing preview": "معاينة الرسمة",
  "Uploading your drawing…": "جارٍ رفع رسمتك…",
  "Artwork by": "رسمة",
  "A drawing inspired by": "رسمة مستوحاة من",
  "Every drawing is a little world of imagination.": "كل رسمة عالم صغير من الخيال.",
  "Gallery stars": "نجوم المعرض",
  "This gallery shows drawings approved by the DreamWings team.": "يعرض هذا المعرض الرسومات التي اعتمدها فريق دريم وينجز.",
  "Send": "إرسال",
  "Gallery submissions": "الرسومات المقدمة",

  "DreamWings Storybook": "كتاب دريم وينجز",
  "DreamWings Storybook": "كتاب دريم وينجز",

  /* --- monthly book club --- */
  "DreamWings Monthly Book Club": "نادي قراءة دريم وينجز الشهري",
  "DreamWings Monthly Book Club 📚": "نادي قراءة دريم وينجز الشهري 📚",
  "Family Reading Community": "مجتمع القراءة العائلي",
  "Each month, we read a special story together and share gentle bedtime reflections as a family.": "كل شهر نقرأ معاً قصة مميزة ونشارك تأملات هادئة قبل النوم مع العائلة.",
  "Featured Book of the Month": "كتاب الشهر المميز",
  "This Month's Book Club": "نادي القراءة لهذا الشهر",
  "One story, one gentle question, one shared moment — every month.": "قصة واحدة، وسؤال لطيف واحد، ولحظة نشاركها معاً — كل شهر.",
  "A heartwarming bedtime adventure about small acts of kindness, empathy, and learning that even the softest light can brighten someone's lonely night.": "مغامرة دافئة قبل النوم عن صغائر العطف والتعاطف، وعن أن أضعف ضوء قد ينير ليلة قلبٍ وحيد.",
  "Kindness is never too small — even one warm blanket can comfort a lonely heart.": "اللطف لا يكون صغيراً أبداً — حتى بطانية دافئة واحدة قد تواسي قلباً وحيداً.",
  "Visit the Book Club": "زيارة نادي القراءة",
  "November Featured Book": "كتاب شهر نوفمبر",
  "Read Book of the Month": "اقرأ كتاب الشهر",
  "Bedtime Discussion Questions": "أسئلة للنقاش قبل النوم",
  "Ask these gentle questions to your little adventurer after reading tonight:": "اسألوا هذه الأسئلة اللطيفة لصغاركم بعد قراءة القصة الليلة:",
  "Share Your Family's Reflection": "شاركوا تأمل عائلتكم",
  "Parent & Child Name (e.g. Mama Sarah & Adam)": "اسم الوالد والطفل (مثال: ماما سارة وآدم)",
  "What was your child's favorite part or answer?": "ما هو الجزء أو الجواب المفضل لطفلك؟",
  "Post Our Reflection": "انشر تأملنا",
  "🧡 Thank you for sharing your family reflection with our Book Club! ✨": "🧡 شكراً لمشاركة تأمل عائلتكم مع نادي القراءة! ✨",
  "Moral of the story": "الحكمة من القصة",
  "This month's moral lesson": "درس الشهر",
  "Reading together this month": "نقرأ معاً هذا الشهر",
  "Family reflections": "تأملات العائلات",
  "No reflections yet. Be the first family to share 💛": "لا توجد تأملات بعد. كونوا أول عائلة تشارك 💛",
  "Featured by Hind": "اختيار هند",
  "Open the book": "افتح الكتاب",
  "The moral lesson": "الدرس الأخلاقي",
  "This month's book is being prepared. Come back soon ✨": "نُجهّز كتاب هذا الشهر. عودوا قريباً ✨",
  "Book of the month": "كتاب الشهر",
  "Reader reflections": "تأملات القرّاء",
  "Hind (Creator of DreamWings)": "هند (مبدعة دريم وينجز)",

  /* --- printable certificate --- */
  "Printable Reading Certificate": "شهادة قراءة قابلة للطباعة",
  "Printable Reading Certificate 🎓": "شهادة قراءة قابلة للطباعة 🎓",
  "Reader Honors & Certificates": "تكريم القرّاء والشهادات",
  "Reward your child's magical reading accomplishments with an official personalized diploma to print and frame!": "كافئوا إنجازات طفلكم القرائية بشهادة رسمية مخصصة للطباعة والتأطير!",
  "Child's Name:": "اسم الطفل:",
  "Enter child's name": "أدخل اسم الطفل",
  "Print Certificate": "طباعة الشهادة",
  "Download PDF": "تنزيل PDF",
  "Certificate of Achievement": "شهادة إنجاز",
  "For Inspiring Reading & Imagination": "للقراءة الملهمة والخيال",
  "This magical certificate is proudly presented to": "تُمنح هذه الشهادة السحرية بكل فخر إلى",
  "In recognition of outstanding curiosity, dedication to bedtime stories, and opening their wings to explore wonderful tales of kindness, friendship, and courage.": "تقديراً لفضولهم المميز وحرصهم على حكايات ما قبل النوم، وفتح أجنحتهم لاستكشاف حكايات رائعة عن الطيبة والصداقة والشجاعة.",
  "Date Awarded": "تاريخ المنح",
  "Founder, DreamWings": "مؤسسة دريم وينجز",
  "DreamWings Storybook Academy": "أكاديمية كتاب دريم وينجز",
  "Little Explorer": "المستكشف الصغير",
  "Stories completed": "قصص مكتملة",
  "Read {count} of {target} stories to unlock your certificate": "اقرأ {count} من {target} قصص لفتح شهادتك",
  "🎉 Your certificate is ready to print!": "🎉 شهادتك جاهزة للطباعة!",
  "Keep reading to unlock your certificate": "واصل القراءة لفتح شهادتك",
  "Your Reading Journey": "رحلة قراءتك",
  "Generate an official, printable diploma featuring your child's name to celebrate their reading journey!": "أنشئ شهادة رسمية قابلة للطباعة تحمل اسم طفلك للاحتفال برحلة قراءته!",
  "Get My Certificate": "احصل على شهادتي",
  "Reading Certificate of Achievement": "شهادة إنجاز القراءة",
  "of {target} stories": "من {target} قصص",
  "Next reward in {count} stories": "المكافأة التالية بعد {count} قصص",
  "You unlocked your certificate!": "لقد فتحت شهادتك!",
  "Reader name": "اسم القارئ",
  "Awarded": "تاريخ المنح",

  "Browse the Library": "تصفّح المكتبة",
  "Join the discussion": "شاركوا النقاش",
  "A favorite sentence, a funny answer, or the moment your child's eyes lit up.": "جملة مفضلة، أو إجابة طريفة، أو اللحظة التي لمعت فيها عيون طفلكم.",
  "Up to 500 characters.": "حتى 500 حرف.",
  "Please add your name and a short reflection.": "يرجى إضافة اسمكم وتأمل قصير.",
  "Posting your reflection…": "جارٍ نشر تأملكم…",
  "Your reflection could not be posted. Please try again.": "لم يتم نشر تأملكم. يرجى المحاولة مرة أخرى.",
  "Read {count} more stories to unlock this certificate.": "اقرأ {count} قصص أخرى لفتح هذه الشهادة.",
  "Add your child's name before printing.": "أضف اسم طفلك قبل الطباعة.",
  "Your certificate image is ready!": "صورة شهادتك جاهزة!",
  "The certificate could not be created. Please try printing instead.": "تعذّر إنشاء الشهادة. يمكنك تجربة الطباعة بدلاً من ذلك.",
  "Tip: turn on “Background graphics” in your print settings for the full gold frame.": "نصيحة: فعّل «رسومات الخلفية» في إعدادات الطباعة للحصول على الإطار الذهبي الكامل.",
  "Sorry, the card could not be created. Please try again.": "عذراً، تعذّر إنشاء البطاقة. حاول مرة أخرى.",
  "Sharing is not available in this browser.": "المشاركة غير متاحة في هذا المتصفح.",
  "Download Story Card": "تنزيل بطاقة الستوري",
  "Square": "مربع",
  "Share": "مشاركة",

  "No stories have been added to this shelf yet. Add one from the Admin Panel ✨": "لم تُضف قصص إلى هذا الرف بعد. أضف قصة من لوحة التحكم ✨",
  "This book has no text story yet. The owner can add it from the Admin Panel.": "لا يحتوي هذا الكتاب على نص قصصي بعد. يمكن للمبدعة إضافته من لوحة التحكم.",

  "Interactive Story Library": "مكتبة قصص تفاعلية",
  "Welcome to the world of tales, hero!": "أهلاً بك في عالم الحكايات يا بطل!",
  "Come sit with me — the pages are warm tonight.": "تعال واجلس معي — الصفحات دافئة الليلة.",
  "Which story shall we fly into?": "إلى أي حكاية نطير؟",
  "Tap the little reader": "المس القارئة الصغيرة",
  "Say hello to the little reader": "قل مرحباً للقارئة الصغيرة",
  "A little reader under a tree of flying pages": "قارئة صغيرة تحت شجرة من صفحات طائرة",
  "This month's book club": "نادي كتاب هذا الشهر",
  "Watch this month's featured story ✨": "شاهد قصة هذا الشهر المميزة ✨",
  "Welcome to the world of tales, hero! Shall we start reading?": "أهلاً بك في عالم الحكايات يا بطل! هل نبدأ القراءة؟",
  "Come sit beside me — the pages are warm tonight.": "اجلس بجانبي — الصفحات دافئة الليلة.",
  "Every page is a little wing. Ready to fly?": "كل صفحة جناح صغير. هل أنت مستعد للطيران؟",
  /* --- gamification additions: avatar, journal, champions, spotlight --- */
  "My profile": "ملفي الشخصي",
  "Book details": "تفاصيل الكتاب",
  "Continue Reading": "متابعة القراءة",
  "Back to the book details — you can watch the story video below.": "عدنا إلى تفاصيل الكتاب — يمكنك مشاهدة فيديو القصة بالأسفل.",
  "Weekly Reading Champions": "أبطال القراءة الأسبوعيون",
  "Our little heroes this week": "أبطالنا الصغار هذا الأسبوع",
  "Finish a story, climb the stars, and collect a magical title.": "أكمل قصة، واصعد بين النجوم، واحصل على لقب سحري.",
  "This week's little heroes": "أبطال هذا الأسبوع",
  "Every story you finish earns your place — and a new magical title.": "كل قصة تكملها تمنحك مكانك — ولقباً سحرياً جديداً.",
  "Loading this week's champions…": "جارٍ تحميل أبطال هذا الأسبوع…",
  "You are": "أنت",
  "Finish a story to join the board!": "أكمل قصة لتنضم إلى لوحة الأبطال!",
  "This week is just beginning — finish a story to appear here! ✨": "الأسبوع بدأ للتو — أكمل قصة لتظهر هنا! ✨",
  "Illustrator of the Month": "رسّام الشهر",
  "Young Illustrator of the Month": "الرسّام الصغير للشهر",
  "Young Illustrator": "رسّام صغير",
  "yrs": "سنة",
  "See the gallery & join next month": "شاهد المعرض وانضم الشهر القادم",
  "Enter the contest": "شارك في المسابقة",
  "Send us your drawing inspired by this month's story — the winning artwork is showcased on our home page!": "أرسل لنا رسمك المستوحى من قصة هذا الشهر — سيُعرض عمل الفائز في صفحتنا الرئيسية!",
  "Draw your favourite scene from {story} and send it below — the winning artwork is showcased on our home page!": "ارسم مشهدك المفضل من {story} وأرسله أدناه — سيُعرض عمل الفائز في صفحتنا الرئيسية!",
  "Home Spotlight": "أضواء الصفحة الرئيسية",
  "Home Spotlight · Illustrator of the Month": "أضواء الصفحة الرئيسية · رسّام الشهر",
  "Pick a child's drawing to celebrate on the home page, with the artist's name, age, story and a short note.": "اختر رسمة طفل للاحتفاء بها في الصفحة الرئيسية، مع اسم الفنان وعمره والقصة وكلمة قصيرة.",
  "Winning drawing": "الرسمة الفائزة",
  "Choose a drawing": "اختر رسمة",
  "Choose a drawing first.": "اختر رسمة أولاً.",
  "Child's name": "اسم الطفل",
  "Age": "العمر",
  "Month · English": "الشهر · الإنجليزية",
  "Month · Arabic": "الشهر · العربية",
  "Inspired by story · English": "مستوحى من قصة · الإنجليزية",
  "Inspired by story · Arabic": "مستوحى من قصة · العربية",
  "Sweet note · English": "كلمة لطيفة · الإنجليزية",
  "Sweet note · Arabic": "كلمة لطيفة · العربية",
  "Feature on Home Page": "اعرضها في الصفحة الرئيسية",
  "Remove from Home": "أزلها من الصفحة الرئيسية",
  "Featured on the home page! ✨": "تم عرضها في الصفحة الرئيسية! ✨",
  "Spotlight hidden from the home page.": "تم إخفاء الأضواء من الصفحة الرئيسية.",
  "Could not update the spotlight. Please try again.": "تعذّر تحديث الأضواء. حاول مرة أخرى.",
  "Magical Character Creator": "صانع الشخصية السحرية",
  "Design your reading hero": "صمّم بطل القراءة الخاص بك",
  "Pick a hat, choose your eye colour and adopt a little companion. Your hero appears inside every story you open.": "اختر قبعة ولون عيون ورفيقاً صغيراً. يظهر بطلك داخل كل قصة تفتحها.",
  "Magical hat": "قبعة سحرية",
  "Eye colour": "لون العيون",
  "Pet companion": "رفيق صغير",
  "Save my hero": "احفظ بطلي",
  "Saving your hero…": "جارٍ حفظ بطلك…",
  "Your magical hero is ready! ✨": "بطلك السحري جاهز! ✨",
  "Your hero could not be saved. Please try again.": "تعذّر حفظ بطلك. حاول مرة أخرى.",
  "No hat": "بلا قبعة",
  "Wizard hat": "قبعة ساحر",
  "Golden crown": "تاج ذهبي",
  "Flower crown": "إكليل زهور",
  "Cozy beanie": "طاقية دافئة",
  "Brown eyes": "عيون بنية",
  "Green eyes": "عيون خضراء",
  "Blue eyes": "عيون زرقاء",
  "Violet eyes": "عيون بنفسجية",
  "No pet": "بلا رفيق",
  "Little bird": "عصفور صغير",
  "Sleepy cat": "قطة نعسانة",
  "Clever fox": "ثعلب ذكي",
  "Bedtime Gratitude Journal": "مفكرة الامتنان قبل النوم",
  "Little happy moments": "لحظات صغيرة سعيدة",
  "One gentle question after each story, kept safely in your archive.": "سؤال لطيف بعد كل قصة، محفوظ بأمان في أرشيفك.",
  "One last thing before sleep…": "شيء أخير قبل النوم…",
  "What was the best thing that happened to you today?": "ما أجمل ما حدث لك اليوم؟",
  "Today I felt happy because…": "شعرت بالسعادة اليوم لأن…",
  "Save to my journal": "احفظ في مفكرتي",
  "Write one little happy moment first 💛": "اكتب لحظة سعيدة صغيرة أولاً 💛",
  "Saved to your bedtime journal ✨": "تم الحفظ في مفكرة ما قبل النوم ✨",
  "No entries yet — tonight is a lovely time to start 💛": "لا توجد مدخلات بعد — الليلة وقت جميل للبدء 💛",
  "From": "من",
  "I'm reading this one with you!": "أنا أقرأ هذه القصة معك!",
  "Ready for a story together?": "جاهز لقصة معاً؟",
  "What a beautiful day to remember. Sleep well! 🌙": "يا له من يوم جميل يستحق التذكّر. نم جيداً! 🌙",
  "Benny Bear & The Sleepy Star": "بيني الدب والنجمة النعسانة",
  "Benny Bear & The Sleepy Star": "بيني الدب والنجمة النعسانة",
  "Lila & The Midnight Lantern": "ليلى والفانوس المنتصف الليلي",
  "Lila & The Midnight Lantern": "ليلى والفانوس المنتصف الليلي",
  "Kindness & Morals": "اللطف والقيم",
  "Moral lesson (Arabic)": "الدرس الأخلاقي (العربية)",
  "Moral lesson (English)": "الدرس الأخلاقي (الإنجليزية)",
  "Short description (Arabic)": "وصف قصير (العربية)",
  "Short description (English)": "وصف قصير (الإنجليزية)",
  "Title (Arabic)": "العنوان (العربية)",
  "Title (English)": "العنوان (الإنجليزية)",
  "Month label — Arabic translation (optional)": "اسم الشهر — الترجمة العربية (اختياري)",
  "Jump straight to the most used creator tools.": "انتقل مباشرة إلى أدوات المبدعة الأكثر استخداماً.",
  "Notes sent through the contact form.": "الرسائل الواردة عبر نموذج التواصل.",
  "Search, edit or remove any published story.": "ابحث عن أي قصة منشورة أو عدّلها أو احذفها.",
  "Your newest stories, ready to edit or remove.": "أحدث قصصك، جاهزة للتعديل أو الحذف.",
  "What was the main lesson of the story?": "ما الدرس الأساسي في القصة؟",
  "A little note (optional)": "كلمة صغيرة (اختياري)",
  /* --- profile additions --- */
  "Your magical progress": "تقدمك السحري",
  "Magical Excellence Stars": "نجوم التميز السحري",
  "Stars earned": "نجوم مكتسبة",
  "Creator tools": "أدوات المبدعة",
  "Manage your stories, gallery and monthly book club in one private place.": "أدِر قصصك ومعرض الرسومات ونادي القراءة الشهري في مكان خاص واحد.",
  "Open Admin Panel": "افتح لوحة التحكم",
  "This area is for the platform creator only.": "هذه المنطقة مخصّصة لمبدعة المنصة فقط.",
  "You do not have administrator access.": "لا تملك صلاحيات الإدارة.",
  "Reading streak": "سلسلة القراءة",
  "Keep shining, {name}!": "واصل التألق يا {name}!",

  /* --- admin panel --- */
  "Admin Control Panel": "لوحة تحكم الإدارة",
  "Restricted Area": "منطقة محظورة",
  "This area is reserved for the platform creator only.": "هذه المنطقة مخصصة لمبدعة المنصة فقط.",
  "Verifying your access…": "جارٍ التحقق من صلاحياتك…",
  "You are signed in as {email}. This account does not have administrator access.": "أنت مسجل بـ {email}. هذا الحساب لا يملك صلاحيات الإدارة.",
  "Sign in with the creator account": "سجّل الدخول بحساب المبدعة",
  "Back to Home": "العودة للرئيسية",
  "Overview": "نظرة عامة",
  "Books": "الكتب",
  "Gallery": "المعرض",
  "Book Club": "نادي القراءة",
  "Messages": "الرسائل",
  "Settings": "الإعدادات",
  "Total Books": "إجمالي الكتب",
  "Published Stories": "قصص منشورة",
  "Gallery Submissions": "رسومات مقدمة",
  "Pending Review": "بانتظار المراجعة",
  "Add New Book": "إضافة كتاب جديد",
  "Manage Books": "إدارة الكتب",
  "Add a story to the library with cover, illustrations, narration and optional video.": "أضف قصة إلى المكتبة مع الغلاف والرسوم والسرد الصوتي وفيديو اختياري.",
  "Book title": "عنوان الكتاب",
  "Author": "المؤلف",
  "Category": "القسم",
  "Story text": "نص القصة",
  "Cover image": "صورة الغلاف",
  "Add illustration": "أضف رسمة",
  "Audio narration": "السرد الصوتي",
  "Story video": "فيديو القصة",
  "Publish Book": "نشر الكتاب",
  "Book published successfully! ✨": "تم نشر الكتاب بنجاح! ✨",
  "Book updated successfully! ✨": "تم تحديث الكتاب بنجاح! ✨",
  "Book deleted.": "تم حذف الكتاب.",
  "Delete book": "حذف الكتاب",
  "Are you sure you want to delete “{title}”? This cannot be undone.": "هل أنت متأكدة من حذف «{title}»؟ لا يمكن التراجع عن هذا الإجراء.",
  "Edit Book": "تعديل الكتاب",
  "Save Changes": "حفظ التغييرات",
  "Search books…": "ابحث في الكتب…",
  "No books yet. Add your first story ✨": "لا توجد كتب بعد. أضف قصتك الأولى ✨",
  "Title": "العنوان",
  "Date": "التاريخ",
  "Actions": "إجراءات",
  "Approve": "اعتماد",
  "Hide": "إخفاء",
  "Reject": "رفض",
  "Approved": "معتمد",
  "Pending": "قيد المراجعة",
  "Hidden": "مخفي",
  "Gallery Moderation": "مراجعة المعرض",
  "Approve drawings to show them in the public gallery.": "اعتمد الرسومات لتظهر في المعرض العام.",
  "No submissions yet.": "لا توجد مشاركات بعد.",
  "Book Club Settings": "إعدادات نادي القراءة",
  "Choose the featured book of the month and write its discussion questions.": "اختر كتاب الشهر واكتب أسئلة النقاش.",
  "Featured book": "الكتاب المميز",
  "Month label": "اسم الشهر",
  "Short description": "وصف قصير",
  "Moral lesson": "الدرس الأخلاقي",
  "Discussion question {n}": "سؤال النقاش {n}",
  "Save Book Club": "حفظ نادي القراءة",
  "Book Club updated! ✨": "تم تحديث نادي القراءة! ✨",
  "Arabic translation (optional)": "الترجمة العربية (اختياري)",
  "Admin access required": "صلاحيات الإدارة مطلوبة",
  "Creator tools": "أدوات المبدعة",
  "Admin": "الإدارة",
  "Manage the whole platform from one warm little corner.": "أدِر المنصة بالكامل من زاوية دافئة واحدة.",
  "Quick actions": "إجراءات سريعة",
  "Recent books": "أحدث الكتب",
  "View all": "عرض الكل",
  "Upload cover": "ارفع الغلاف",
  "Drop files here or click to browse": "أفلت الملفات هنا أو اضغط للاختيار",
  "Each illustration is shown beside a story page, in order.": "تُعرض كل رسمة بجانب صفحة من القصة، بالترتيب.",
  "Uploading…": "جارٍ الرفع…",
  "Saving book details…": "جارٍ حفظ تفاصيل الكتاب…",
  "Book saved": "تم حفظ الكتاب",
  "Could not save the book: {message}": "تعذّر حفظ الكتاب: {message}",
  "Missing fields": "حقول ناقصة",
  "Please add a title, author, story text and cover image.": "يرجى إضافة العنوان والمؤلف ونص القصة وصورة الغلاف.",
  "Gallery item approved.": "تم اعتماد الرسمة.",
  "Gallery item hidden.": "تم إخفاء الرسمة.",
  "Gallery item deleted.": "تم حذف الرسمة.",
  "Delete this drawing permanently?": "هل تريد حذف هذه الرسمة نهائياً؟",
  "No category": "بدون قسم",
  "Tell us about the story": "أخبرنا عن القصة",
  "Used on the library shelf and reader.": "تُستخدم في رف المكتبة وصفحة القراءة.",
  "Optional narration": "سرد صوتي اختياري",
  "Optional video": "فيديو اختياري",
  "Book language": "لغة الكتاب",
  "Bilingual (Arabic & English)": "ثنائي اللغة (عربي وإنجليزي)",
  "English": "الإنجليزية",
  "Arabic": "العربية",
  "Sign Out": "تسجيل الخروج",
  "Session expired. Please sign in again.": "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  "Choose a book": "اختر كتاباً",
  "Choose an audio file up to 50 MB.": "اختر ملفاً صوتياً حتى 50 ميغابايت.",
  "Choose a video up to 250 MB.": "اختر فيديو حتى 250 ميغابايت.",
  "Choose an image up to 8 MB (JPG, PNG or WebP).": "اختر صورة حتى 8 ميغابايت (JPG أو PNG أو WebP).",
  "Tip: leave a blank line between paragraphs. Each paragraph becomes part of a page.": "نصيحة: اترك سطراً فارغاً بين الفقرات. كل فقرة تصبح جزءاً من صفحة.",
  "JPG, PNG or WebP · up to 8 MB": "JPG أو PNG أو WebP · حتى 8 ميغابايت",
  "MP3 / M4A / WAV · up to 50 MB": "MP3 / M4A / WAV · حتى 50 ميغابايت",
  "MP4 / WebM · up to 250 MB": "MP4 / WebM · حتى 250 ميغابايت",
  "Add story illustrations": "أضف رسومات القصة",
  "Cover override": "استبدال الغلاف",
  "Are you sure you want to delete this book permanently?": "هل أنت متأكدة من رغبتك في حذف هذا الكتاب نهائياً؟",
  "Are you sure you want to delete “{title}”? This cannot be undone.": "هل أنت متأكدة من حذف «{title}»؟ لا يمكن التراجع عن هذا الإجراء.",
  "Delete this drawing permanently?": "هل تريد حذف هذه الرسمة نهائياً؟",
};

/* ---------- Arabic -> English ----------
   Built automatically from the main dictionary so any string rendered through
   dwT() can also be restored when the visitor switches back to English. */
const TO_EN = {};
for (const [en, ar] of Object.entries(TO_AR)) {
  if (ar && !(ar in TO_EN)) TO_EN[ar] = en;
}
Object.assign(TO_EN, {
  "غير مسموح لك بالدخول إلى هذه الصفحة": "You are not allowed to access this page",
  "هذه الصفحة مخصصة للمشرفة فقط.": "This page is reserved for the site owner only.",
  "العودة للرئيسية": "Back to Home",
  "تم حذف الكتاب بنجاح!": "Book deleted successfully!",
  "حدث خطأ أثناء محاولة الحذف:": "An error occurred while deleting:",
  "غير مسموح لك بإجراء عملية الحذف.": "You are not allowed to delete.",
  "غير مسموح لك بالتعديل.": "You are not allowed to edit.",
  "هل أنت متأكدة من رغبتك في حذف هذا الكتاب نهائياً؟": "Are you sure you want to delete this book permanently?",
});

const norm = value => String(value).replace(/\s+/g, " ").trim();

/* ---------- registry so we can always restore English ---------- */
const registry = []; // { target, kind:'text'|'attr', attr, en }

function setEntry(entry, value) {
  if (entry.kind === "text") entry.target.nodeValue = value;
  else entry.target.setAttribute(entry.attr, value);
}

function translateTextNode(node) {
  const raw = node.nodeValue;
  if (!raw || !raw.trim()) return null;
  const key = norm(raw);
  let ar = TO_AR[key];

  // Dynamic strings like "A story by Hind" -> template
  if (!ar && lang === "ar") {
    for (const template of Object.values(TEMPLATES)) {
      const m = key.match(template.pattern);
      if (m) { ar = template.ar(m); break; }
    }
  }
  if (!ar) return null;

  const entry = { target: node, kind: "text", en: key };
  registry.push(entry);
  node.nodeValue = ar;
  return entry;
}

const TEMPLATES = {
  "story-by": {
    pattern: /^A story by (.+)$/,
    ar: m => "قصة بقلم " + m[1],
  },
  "found-shelves": {
    pattern: /^Found (\d+) story shelves matching your search ✨$/,
    ar: m => `تم العثور على ${m[1]} رفوف قصص تطابق بحثك ✨`,
  },
  "page-of": {
    pattern: /^Page (\d+) of (\d+)$/,
    ar: m => `صفحة ${m[1]} من ${m[2]}`,
  },
  "question-of": {
    pattern: /^Question (\d+) of (\d+)$/,
    ar: m => `السؤال ${m[1]} من ${m[2]}`,
  },
  "read-of": {
    pattern: /^Read (\d+) of (\d+) stories to unlock your certificate$/,
    ar: m => `اقرأ ${m[1]} من ${m[2]} قصص لفتح شهادتك`,
  },
  "showing-for": {
    pattern: /^Showing (\d+) stories for “(.+)”$/,
    ar: m => `عرض ${m[1]} قصة لـ «${m[2]}»`,
  },
  "signed-in": {
    pattern: /^You are signed in as (.+)\. This account does not have administrator access\.$/,
    ar: m => `أنت مسجل بـ ${m[1]}. هذا الحساب لا يملك صلاحيات الإدارة.`,
  },
};

function translateAttributes(el) {
  let any = false;
  for (const attr of ["placeholder", "title", "aria-label", "alt"]) {
    const value = el.getAttribute?.(attr);
    if (!value) continue;
    const key = norm(value);
    let ar = TO_AR[key];
    if (!ar || ar === value) continue;
    registry.push({ target: el, kind: "attr", attr, en: value });
    el.setAttribute(attr, ar);
    any = true;
  }
  return any;
}

function walk(root) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) { translateTextNode(root); return; }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) {
    if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(root.tagName)) return;
    translateAttributes(root);
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE && ["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
    else translateAttributes(node);
  }
}

function translateTitle() {
  const el = document.querySelector("title");
  if (!el) return;
  const key = norm(el.textContent);
  if (!el.dataset.dwEn) el.dataset.dwEn = key;
  const en = el.dataset.dwEn;
  if (lang === "ar") {
    if (TO_AR[en]) {
      el.textContent = TO_AR[en];
    } else if (en.startsWith("DreamWings | ")) {
      const sub = en.slice("DreamWings | ".length).trim();
      const arSub = TO_AR[sub] || sub;
      el.textContent = `دريم وينجز | ${arSub}`;
    } else {
      el.textContent = TO_AR[en] || en;
    }
  } else {
    el.textContent = en;
  }
}

function toEnglish() {
  for (let i = registry.length - 1; i >= 0; i--) {
    const entry = registry[i];
    const alive = entry.kind === "text" ? entry.target.isConnected : entry.target.isConnected;
    if (alive) setEntry(entry, entry.en);
  }
  // restore any hard-coded Arabic on this page
  if (lang === "en") {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const key = norm(node.nodeValue || "");
      const en = TO_EN[key];
      if (en) node.nodeValue = en;
      const el = node.parentElement;
      if (el) {
        for (const attr of ["placeholder", "title", "aria-label", "alt"]) {
          const v = el.getAttribute?.(attr);
          if (v && TO_EN[norm(v)]) el.setAttribute(attr, TO_EN[norm(v)]);
        }
      }
    }
  }
}

/* ---------- observer for dynamically rendered content ---------- */
let observer = null;
let applying = false;

function startObserver() {
  if (observer || lang !== "ar") return;
  observer = new MutationObserver(mutations => {
    if (applying) return;
    applying = true;
    for (const m of mutations) {
      if (m.type === "childList") m.addedNodes.forEach(node => walk(node));
      if (m.type === "characterData") {
        const key = norm(m.target.nodeValue || "");
        if (TO_AR[key]) translateTextNode(m.target);
      }
    }
    applying = false;
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function stopObserver() {
  if (observer) { observer.disconnect(); observer = null; }
}

/* ---------- the styled switch ---------- */
function injectStyles() {
  if (document.getElementById("dw-lang-styles")) return;
  const style = document.createElement("style");
  style.id = "dw-lang-styles";
  style.textContent = `
    .dw-lang-switch{
      position:relative; display:inline-flex; align-items:center; gap:0;
      padding:4px; border-radius:999px; isolation:isolate;
      background:linear-gradient(135deg, rgba(255,214,160,.16), rgba(255,255,255,.05));
      border:1px solid rgba(245,183,90,.55);
      box-shadow:0 6px 18px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.14);
      backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
      font-family:Quicksand, sans-serif; user-select:none; height:40px;
    }
    .dw-lang-switch::before{
      content:""; position:absolute; z-index:0; top:4px; bottom:4px; left:4px;
      width:calc(50% - 4px); border-radius:999px;
      background:linear-gradient(135deg,#f6c473,#e08a2e);
      box-shadow:0 4px 12px rgba(224,138,46,.45), inset 0 1px rgba(255,255,255,.5);
      transition:transform .32s cubic-bezier(.4,1.4,.5,1);
    }
    .dw-lang-switch[data-lang="ar"]::before{ transform:translateX(calc(100% + 0px)); }
    .dw-lang-switch button{
      position:relative; z-index:1; flex:1 1 50%; min-width:52px; height:32px; padding:0 12px;
      border:0; background:transparent; cursor:pointer; border-radius:999px;
      font:700 12.5px/1 Quicksand, sans-serif; letter-spacing:.4px;
      color:#f3ddc6; transition:color .25s ease, opacity .2s; display:inline-flex;
      align-items:center; justify-content:center; gap:5px;
    }
    .dw-lang-switch button:hover{ color:#fff5e6; }
    .dw-lang-switch button[aria-pressed="true"]{ color:#3a2413; }
    .dw-lang-switch .dw-flag{ font-size:13px; line-height:1; }
    @media(max-width:560px){
      .dw-lang-switch{ height:36px; padding:3px; }
      .dw-lang-switch::before{ top:3px; bottom:3px; left:3px; }
      .dw-lang-switch button{ min-width:42px; height:28px; padding:0 9px; font-size:11px; }
    }

    /* ---------- Arabic (RTL) reading & layout polish ---------- */
    html[dir="rtl"] body {
      font-family: "Tajawal", "Cairo", "Quicksand", sans-serif;
    }
    html[dir="rtl"] .navbar,
    html[dir="rtl"] .nav-links,
    html[dir="rtl"] .nav-actions {
      direction: rtl;
    }

    /* Hero Section (Home - split grid: text on right, artwork on left) */
    html[dir="rtl"] .hero-text-side {
      text-align: right;
    }
    html[dir="rtl"] .hero-title,
    html[dir="rtl"] .hero-subtitle {
      text-align: right;
      letter-spacing: 0;
    }
    html[dir="rtl"] .hero-subtitle {
      margin-inline-start: 0;
      margin-inline-end: auto;
    }

    /* Hero Section (Centered: Profile & Library Pages) */
    html[dir="rtl"] .library-hero,
    html[dir="rtl"] .library-hero .hero-content {
      text-align: center !important;
    }
    html[dir="rtl"] .library-title {
      text-align: center !important;
      letter-spacing: 0;
    }
    html[dir="rtl"] .library-subtitle {
      text-align: center !important;
    }
    html[dir="rtl"] .library-hero .hero-text-badge {
      margin-left: auto;
      margin-right: auto;
    }

    /* Intro & Audio Section (Home) */
    html[dir="rtl"] .story-card-glass {
      direction: rtl;
    }
    html[dir="rtl"] .intro-content,
    html[dir="rtl"] .intro-content h2,
    html[dir="rtl"] .intro-content p {
      text-align: right;
    }
    html[dir="rtl"] .intro-content h2 {
      letter-spacing: 0;
    }
    html[dir="rtl"] .narrator-tag {
      display: inline-block;
    }

    /* How It Works Section (Home - centered cards) */
    html[dir="rtl"] .section-title-center {
      text-align: center;
    }
    html[dir="rtl"] .section-title-center h2 {
      letter-spacing: 0;
    }
    html[dir="rtl"] .step-card {
      text-align: center;
    }
    html[dir="rtl"] .step-card h3 {
      letter-spacing: 0;
      text-align: center;
    }
    html[dir="rtl"] .step-card p {
      text-align: center;
    }
    html[dir="rtl"] .step-number {
      right: auto;
      left: 20px;
    }

    /* Buttons & Icons Alignment (Natural flex flow in RTL) */
    html[dir="rtl"] .cta-btn-magical i {
      transform: scaleX(-1);
    }
    html[dir="rtl"] .btn-read-now i {
      transform: scaleX(-1);
    }
    html[dir="rtl"] .btn-logout i {
      transform: scaleX(-1);
    }

    /* Profile Page Components */
    html[dir="rtl"] .profile-stats-grid .profile-stat-card {
      text-align: center;
    }
    html[dir="rtl"] .profile-stat-card h3 {
      letter-spacing: 0;
      text-align: center;
    }
    html[dir="rtl"] .profile-stat-card p {
      text-align: center;
    }
    html[dir="rtl"] .profile-edit-card {
      text-align: right;
    }
    html[dir="rtl"] .profile-edit-card h2,
    html[dir="rtl"] .profile-edit-card h3 {
      text-align: right;
      letter-spacing: 0;
    }
    html[dir="rtl"] .profile-edit-card h2 i {
      margin-left: 8px;
      margin-right: 0;
    }
    html[dir="rtl"] .shelf-header h2 {
      text-align: right;
      letter-spacing: 0;
    }
    html[dir="rtl"] .shelf-header h2 i {
      margin-left: 8px;
      margin-right: 0;
    }
    html[dir="rtl"] .studio-help {
      text-align: right;
    }
    html[dir="rtl"] #profileSaveStatus {
      text-align: right;
    }
    html[dir="rtl"] .profile-badges-card {
      text-align: right;
    }
    html[dir="rtl"] .profile-badges-card h2,
    html[dir="rtl"] .profile-badges-card p {
      text-align: right;
    }
    html[dir="rtl"] .badges-header h2 i {
      margin-left: 8px;
      margin-right: 0;
    }
    html[dir="rtl"] .badge-item {
      direction: rtl;
      text-align: right;
    }
    html[dir="rtl"] .badge-status-tag {
      justify-content: flex-start;
    }

    /* Footer (Shared across pages) */
    html[dir="rtl"] .footer-col,
    html[dir="rtl"] .footer-col h3,
    html[dir="rtl"] .footer-col h4,
    html[dir="rtl"] .footer-col p,
    html[dir="rtl"] .footer-col a {
      text-align: right;
    }
    html[dir="rtl"] .footer-col h3,
    html[dir="rtl"] .footer-col h4 {
      letter-spacing: 0;
    }
    html[dir="rtl"] .social-icons {
      justify-content: flex-start;
    }
    html[dir="rtl"] .footer-bottom {
      text-align: center;
    }

    /* Reader, Modals & Toast Utilities */
    html[dir="rtl"] .page-content,
    html[dir="rtl"] .reader-story-text {
      direction: rtl;
      text-align: right;
    }
    html[dir="rtl"] .book-title-embossed,
    html[dir="rtl"] .book-author-styled {
      direction: rtl;
    }
    html[dir="rtl"] .closed-cover-front {
      direction: rtl;
    }
    html[dir="rtl"] .open-book-ribbon {
      left: 50%;
    }
    html[dir="rtl"] .dw-book-caption {
      text-align: right;
    }
    html[dir="rtl"] .story-card-glass h2 {
      letter-spacing: 0;
    }
    html[dir="rtl"] .dw-lang-switch {
      direction: ltr;
    }
    html[dir="rtl"] .dw-toast-copy {
      text-align: right;
    }

    /* Floating switcher for pages without a navbar host */
    .dw-floating-lang-host {
      position: fixed;
      top: 18px;
      right: 18px;
      left: auto;
      z-index: 9998;
      display: inline-flex;
      align-items: center;
    }
    html[dir="rtl"] .dw-floating-lang-host {
      right: auto;
      left: 18px;
    }
    .dw-lang-switch {
      flex: 0 0 auto;
      height: 38px;
    }

    /* Arabic typography for the newer components */
    html[dir="rtl"] .dw-ar-text,
    html[dir="rtl"] .dw-prose {
      font-family: "Tajawal", "Cairo", "Quicksand", sans-serif;
      letter-spacing: 0;
    }
  `;
  document.head.appendChild(style);
}

/* The switcher is available on every page of the platform. */
function toggleAllowed() {
  if (document.documentElement.hasAttribute("data-lang-toggle")) return true;
  return !!document.querySelector(".nav-actions");
}

function renderSwitch() {
  if (!toggleAllowed()) return;
  let host = document.querySelector(".nav-actions");
  if (!host) {
    host = document.createElement("div");
    host.className = "nav-actions dw-floating-lang-host";
    document.body.appendChild(host);
  }
  if (host.querySelector(".dw-lang-switch")) return;

  injectStyles();
  const box = document.createElement("div");
  box.className = "dw-lang-switch";
  box.dataset.lang = lang;
  box.setAttribute("role", "group");
  box.setAttribute("aria-label", "Language / اللغة");
  box.innerHTML = `
    <button type="button" data-set-lang="en" aria-pressed="${lang === "en"}"><span class="dw-flag">🇬🇧</span>EN</button>
    <button type="button" data-set-lang="ar" aria-pressed="${lang === "ar"}"><span class="dw-flag">🇪🇬</span>ع</button>
  `;
  box.addEventListener("click", event => {
    const btn = event.target.closest("[data-set-lang]");
    if (!btn) return;
    setLang(btn.dataset.setLang);
  });
  host.insertBefore(box, host.firstChild);
}

function syncSwitch() {
  document.querySelectorAll(".dw-lang-switch").forEach(box => {
    box.dataset.lang = lang;
    box.querySelectorAll("[data-set-lang]").forEach(btn => {
      btn.setAttribute("aria-pressed", String(btn.dataset.setLang === lang));
    });
  });
}

/* ---------- public API ---------- */
export function getLang() { return lang; }
export function isRTL() { return lang === "ar"; }
export function dir() { return lang === "ar" ? "rtl" : "ltr"; }

/** Translate a freshly rendered subtree (useful after dynamic renders). */
export function localize(root = document.body) {
  if (!root) return;
  applying = true;
  if (lang === "ar") walk(root);
  else toEnglish();
  applying = false;
}

export function setLang(next) {
  if (!SUPPORTED.includes(next)) next = "en";
  const previous = lang;
  lang = next;
  storeLang(next);

  document.documentElement.lang = next;
  document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  document.documentElement.classList.toggle("dw-lang-ar", next === "ar");
  document.documentElement.classList.toggle("dw-lang-en", next === "en");

  applying = true;
  if (next === "ar") {
    if (previous === "en") walk(document.body);
    translateTitle();
    startObserver();
  } else {
    stopObserver();
    toEnglish();
    translateTitle();
  }
  applying = false;

  syncSwitch();
  window.dispatchEvent(new CustomEvent("dreamwings:language", {
    detail: { lang: next, dir: next === "ar" ? "rtl" : "ltr" }
  }));
}

/* Used by any module that needs a translated string at runtime. */
export function t(text, vars) {
  const key = norm(text);
  let out = key;
  if (lang === "ar") out = TO_AR[key] || key;
  else out = key;
  if (vars && typeof vars === "object") {
    for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(v);
  }
  return out;
}

window.dwT = t;
window.dwSetLanguage = setLang;
window.dwGetLanguage = getLang;
window.dwIsRTL = isRTL;
window.dwDir = dir;
window.dwLocalize = localize;

/* ---------- boot ---------- */
document.documentElement.lang = lang;
document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
document.documentElement.classList.toggle("dw-lang-ar", lang === "ar");
document.documentElement.classList.toggle("dw-lang-en", lang === "en");

function boot() {
  injectStyles();
  renderSwitch();
  if (lang === "ar") {
    applying = true;
    walk(document.body);
    translateTitle();
    applying = false;
    startObserver();
  } else {
    translateTitle();
  }
  syncSwitch();
}

boot();
document.addEventListener("DOMContentLoaded", boot);
