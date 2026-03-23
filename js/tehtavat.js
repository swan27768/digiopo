const tehtavat = {
  7: [
    {
      aiheId: "tasks-tervetuloa",
      title: "Robo saapuu kouluun",
      description:
        "Interaktiivinen tarina, jossa teet valintoja ja etenet tarinassa.",
      href: "../robotarina.html",
      tag: "Interaktiivinen",
      tagClass: "tag-interactive",
      icon: "fa-book-open",
    },
    {
      aiheId: "tasks-omat-vahvuudet",
      title: "Minun vahvuuteni",
      description: "Pohdi omia vahvuuksiasi ja kirjoita ne ylös tehtävään.",
      href: "../tehtava.html?id=vahvuudet",
      tag: "Tehtävä",
      tagClass: "",
      icon: "fa-pencil",
    },
    {
      aiheId: "tasks-opiskelutaidot",
      title: "Minun opiskelutaitoni",
      description:
        "Arvioi omia opiskelutaitojasi ja mieti, mitä haluat kehittää.",
      href: "../tehtava.html?id=opiskelutaidot",
      tag: "Tehtävä",
      tagClass: "",
      icon: "fa-pencil",
    },
    {
      aiheId: "tasks-opiskelutaidot",
      title: "Ajankäytön harjoitus",
      description:
        "Kokeile interaktiivista tehtävää ja mieti, miten käytät aikaasi.",
      href: "../tehtavat/ajankaytto-peli.html",
      tag: "Interaktiivinen",
      tagClass: "tag-interactive",
      icon: "fa-gamepad",
    },
    {
      aiheId: "tasks-mina-oppijana",
      title: "Minä oppijana",
      description:
        "Tutki omia oppimistapojasi ja kirjaa huomioita itsestäsi oppijana.",
      href: "../tehtava.html?id=mina-oppijana",
      tag: "Tehtävä",
      tagClass: "",
      icon: "fa-pencil",
    },
  ],

  8: [
    {
      aiheId: "tasks-tet",
      title: "TET-päiväkirja",
      description: "Kirjoita TET-jakson kokemuksista ja oppimisesta.",
      href: "../tehtava.html?id=tet8",
      tag: "Tehtävä",
      tagClass: "",
      icon: "fa-pencil",
    },
  ],

  9: [
    {
      aiheId: "tasks-tet",
      title: "TET-päiväkirja",
      description: "Kirjoita TET-jakson kokemuksista ja oppimisesta.",
      href: "../tehtava.html?id=tet9",
      tag: "Tehtävä",
      tagClass: "",
      icon: "fa-pencil",
    },
  ],

  vahvuudet: {
    title: "Omat vahvuudet",
    category: "vahvuudet",
    class: "7",
    instructions: [
      "Kirjoita kolme asiaa, joissa olet hyvä.",
      "Mistä asioista pidät koulussa?",
      "Mitä haluaisit oppia lisää?",
    ],
    pdf: "tehtavat/vahvuudet.pdf",
  },

  opiskelutaidot: {
    title: "Opiskelutaidot",
    category: "opiskelu",
    class: "7",
    instructions: [
      "Suunnittele oma opiskelupäiväsi.",
      "Milloin opiskelet parhaiten?",
      "Miten pidät taukoja?",
    ],
    pdf: "tehtavat/opiskelutaidot.pdf",
  },

  "mina-oppijana": {
    title: "Minä oppijana",
    category: "oppiminen",
    class: "7",
    instructions: [
      "Millä tavalla opit parhaiten?",
      "Mikä auttaa sinua keskittymään?",
      "Missä haluaisit kehittyä oppijana?",
    ],
    pdf: "tehtavat/mina-oppijana.pdf",
  },

  tet8: {
    title: "TET-päiväkirja",
    category: "tet",
    class: "8",
    instructions: [
      "Missä olit TET-jaksolla?",
      "Mitä työtehtäviä teit?",
      "Mitä opit työelämästä?",
    ],
    pdf: "tehtavat/tet.pdf",
  },

  tet9: {
    title: "TET-päiväkirja",
    category: "tet",
    class: "9",
    instructions: [
      "Missä olit TET-jaksolla?",
      "Mitä työtehtäviä teit?",
      "Mitä opit työelämästä?",
    ],
    pdf: "tehtavat/tet.pdf",
  },
};

const tehtavaJarjestys = {
  7: ["vahvuudet", "opiskelutaidot", "mina-oppijana"],
  8: ["tet8"],
  9: ["tet9"],
};
