/**
 * Comprehensive Karnataka Administrative & Cadastral Geographic Dataset
 * Contains all 31 Karnataka Districts, their respective Taluks,
 * representative Localities/Hoblis, typical Pincodes, and governing Jurisdictions.
 */

export const KARNATAKA_LOCATION_DATA = {
  "Bangalore Urban": {
    taluks: {
      "Bangalore North": {
        pincode: "560001",
        jurisdiction: "municipal",
        localities: ["MG Road", "Shivajinagar", "Malleswaram", "Hebbal", "Yelahanka New Town", "Jalahalli", "RT Nagar", "Yeshwanthpur", "Sadashivanagar"]
      },
      "Bangalore South": {
        pincode: "560041",
        jurisdiction: "municipal",
        localities: ["Jayanagar", "JP Nagar", "BTM Layout", "Banashankari", "Basavanagudi", "Padmanabhanagar", "Uttarahalli", "Kanakapura Road"]
      },
      "Bangalore East": {
        pincode: "560066",
        jurisdiction: "municipal",
        localities: ["Whitefield", "Indiranagar", "Marathahalli", "Kalyan Nagar", "KR Puram", "Hennur", "Bellandur", "CV Raman Nagar", "Varthur"]
      },
      "Anekal": {
        pincode: "560100",
        jurisdiction: "panchayat",
        localities: ["Electronic City", "Attibele", "Jigani", "Chandapura", "Sarjapur", "Bannerghatta", "Hebbagodi", "Marsur"]
      },
      "Yelahanka": {
        pincode: "560064",
        jurisdiction: "municipal",
        localities: ["Yelahanka Old Town", "Kogilu", "Vidyaranyapura", "Doddaballapur Road", "Sahakara Nagar", "Chikkajala"]
      }
    }
  },
  "Bangalore Rural": {
    taluks: {
      "Devanahalli": {
        pincode: "562110",
        jurisdiction: "revenue",
        localities: ["Devanahalli Town", "KIA Airport Enclave", "Vijayapura", "Kundana", "Channarayapatna Hobli"]
      },
      "Doddaballapur": {
        pincode: "561203",
        jurisdiction: "revenue",
        localities: ["Doddaballapur Industrial Area", "Tubagere", "Kasaba", "Sasalu", "Doddabelavangala"]
      },
      "Hosakote": {
        pincode: "562114",
        jurisdiction: "revenue",
        localities: ["Hosakote Town", "Nandagudi", "Jadigenahalli", "Sulibele", "Anugondanahalli"]
      },
      "Nelamangala": {
        pincode: "562123",
        jurisdiction: "revenue",
        localities: ["Nelamangala Town", "T. Begur", "Sompura", "Dabaspete", "Madavara"]
      }
    }
  },
  "Mysore": {
    taluks: {
      "Mysore Taluk": {
        pincode: "570002",
        jurisdiction: "municipal",
        localities: ["Gokulam", "Jayalakshmipuram", "Kuvempunagar", "Saraswathipuram", "Vijayanagar", "Hebbal Industrial Area", "Chamundi Hill Foot", "Bannimantap"]
      },
      "Hunsur": {
        pincode: "571105",
        jurisdiction: "revenue",
        localities: ["Hunsur Town", "Bilikere", "Gavadagere", "Kallahalli"]
      },
      "Nanjangud": {
        pincode: "571301",
        jurisdiction: "revenue",
        localities: ["Nanjangud Temple Town", "Kavalande", "Hullahalli", "Hadinaru"]
      },
      "T. Narasipura": {
        pincode: "571124",
        jurisdiction: "revenue",
        localities: ["T. Narasipura", "Bannur", "Mugur", "Sosale"]
      },
      "K.R. Nagar": {
        pincode: "571602",
        jurisdiction: "revenue",
        localities: ["Saligrama", "Mirle", "Hebbal", "Kasaba"]
      },
      "Piriyapatna": {
        pincode: "571107",
        jurisdiction: "revenue",
        localities: ["Piriyapatna Town", "Bettadapura", "Ravandur", "Kittur"]
      },
      "Saragur": {
        pincode: "571121",
        jurisdiction: "panchayat",
        localities: ["Saragur Town", "Mullur", "Sagare", "Kaniyanapura"]
      }
    }
  },
  "Ramanagara": {
    taluks: {
      "Ramanagara Taluk": {
        pincode: "562159",
        jurisdiction: "revenue",
        localities: ["Kasaba", "Kailancha", "Kootagal", "Bidadi Industrial Hub", "Mayaganahalli"]
      },
      "Channapatna": {
        pincode: "562160",
        jurisdiction: "revenue",
        localities: ["Toy City Central", "Makkali", "Virupakshipura", "Malur", "Sogala"]
      },
      "Kanakapura": {
        pincode: "562117",
        jurisdiction: "revenue",
        localities: ["Kanakapura Town", "Harohalli", "Maralawadi", "Uyyamballi", "Sathanur"]
      },
      "Magadi": {
        pincode: "562120",
        jurisdiction: "revenue",
        localities: ["Magadi Fort", "Kudur", "Thippasandra", "Madabal"]
      }
    }
  },
  "Dakshina Kannada": {
    taluks: {
      "Mangalore": {
        pincode: "575001",
        jurisdiction: "municipal",
        localities: ["Hampankatta", "Kadri", "Kodialbail", "Bejai", "Surathkal", "Panambur", "Kavoor"]
      },
      "Bantwal": {
        pincode: "574211",
        jurisdiction: "revenue",
        localities: ["Bantwal Town", "BC Road", "Mani", "Panemangalore", "Vittal"]
      },
      "Puttur": {
        pincode: "574201",
        jurisdiction: "revenue",
        localities: ["Puttur Town", "Uppinangady", "Kabaka", "Nelyadi"]
      },
      "Belthangady": {
        pincode: "574214",
        jurisdiction: "revenue",
        localities: ["Dharmasthala", "Ujire", "Madanthyar", "Venur"]
      },
      "Sullia": {
        pincode: "574239",
        jurisdiction: "revenue",
        localities: ["Sullia Town", "Subrahmanya", "Bellare", "Panja"]
      },
      "Kadaba": {
        pincode: "574221",
        jurisdiction: "panchayat",
        localities: ["Kadaba Central", "Mardhala", "Noojibalthila", "Kutrupady"]
      },
      "Moodabidri": {
        pincode: "574227",
        jurisdiction: "municipal",
        localities: ["Jain Kashi", "Alva Campus Area", "Mijar", "Tenkamijar"]
      }
    }
  },
  "Udupi": {
    taluks: {
      "Udupi Taluk": {
        pincode: "576101",
        jurisdiction: "municipal",
        localities: ["Car Street", "Manipal", "Malpe Harbor", "Santhekatte", "Ambalpady"]
      },
      "Kundapura": {
        pincode: "576201",
        jurisdiction: "municipal",
        localities: ["Kundapura Town", "Koteshwara", "Basrur", "Tallur"]
      },
      "Karkala": {
        pincode: "574104",
        jurisdiction: "revenue",
        localities: ["Gommateshwara Hill", "Bajagoli", "Ajekar", "Bailoor"]
      },
      "Brahmavara": {
        pincode: "576213",
        jurisdiction: "revenue",
        localities: ["Brahmavara Town", "Saligrama", "Barkur", "Kota"]
      },
      "Kaup": {
        pincode: "574106",
        jurisdiction: "municipal",
        localities: ["Kaup Lighthouse", "Uchila", "Katapadi", "Shirva"]
      },
      "Byndoor": {
        pincode: "576214",
        jurisdiction: "revenue",
        localities: ["Byndoor Town", "Shiroor", "Uppunda", "Kambadakone"]
      },
      "Hebri": {
        pincode: "576112",
        jurisdiction: "panchayat",
        localities: ["Hebri Central", "Someshwara", "Kabbinale", "Mudradi"]
      }
    }
  },
  "Belagavi": {
    taluks: {
      "Belagavi Taluk": {
        pincode: "590001",
        jurisdiction: "municipal",
        localities: ["Tilakwadi", "Camp", "Shahapur", "Udyambag", "Vadgaon", "Khasbag"]
      },
      "Gokak": {
        pincode: "591307",
        jurisdiction: "revenue",
        localities: ["Gokak Falls", "Konnur", "Ghataprabha", "Koujalgi"]
      },
      "Chikkodi": {
        pincode: "591201",
        jurisdiction: "revenue",
        localities: ["Chikkodi Town", "Nipani Road", "Kerur", "Soundatti"]
      },
      "Bailhongal": {
        pincode: "591102",
        jurisdiction: "revenue",
        localities: ["Bailhongal", "Kittur Fort Road", "Nesargi", "Devalapur"]
      },
      "Athani": {
        pincode: "591304",
        jurisdiction: "revenue",
        localities: ["Athani Town", "Kagwad", "Shedbal", "Telsang"]
      },
      "Khanapur": {
        pincode: "591302",
        jurisdiction: "revenue",
        localities: ["Khanapur Town", "Nandgad", "Londa", "Bidi"]
      },
      "Savadatti": {
        pincode: "591126",
        jurisdiction: "revenue",
        localities: ["Yellamma Temple Area", "Munavalli", "Ugargol", "Inchal"]
      },
      "Hukkeri": {
        pincode: "591309",
        jurisdiction: "revenue",
        localities: ["Hukkeri Town", "Sankeshwar", "Yamkanmardi", "Hebbal"]
      },
      "Ramdurg": {
        pincode: "591123",
        jurisdiction: "revenue",
        localities: ["Ramdurg Town", "Sureban", "Katkol", "Salahalli"]
      },
      "Raybag": {
        pincode: "591317",
        jurisdiction: "revenue",
        localities: ["Raybag Town", "Kudachi", "Harugeri", "Chinchali"]
      }
    }
  },
  "Dharwad": {
    taluks: {
      "Dharwad Taluk": {
        pincode: "580001",
        jurisdiction: "municipal",
        localities: ["Saptapur", "Kalyan Nagar", "Malmaddi", "Kelgerie", "Navanagar", "University Enclave"]
      },
      "Hubli City & Rural": {
        pincode: "580020",
        jurisdiction: "municipal",
        localities: ["Vidyanagar", "Gokul Road", "Keshwapur", "Old Hubli", "Bengeri", "Unkal Lake"]
      },
      "Kundgol": {
        pincode: "581113",
        jurisdiction: "revenue",
        localities: ["Kundgol Town", "Yarinarayanpur", "Saunshi", "Gudenakatti"]
      },
      "Navalgund": {
        pincode: "582208",
        jurisdiction: "revenue",
        localities: ["Navalgund", "Annigeri Road", "Morab", "Alagawadi"]
      },
      "Kalghatgi": {
        pincode: "581114",
        jurisdiction: "revenue",
        localities: ["Kalghatgi Town", "Mishrikoti", "Dummavada", "Tamboor"]
      },
      "Alnavar": {
        pincode: "581103",
        jurisdiction: "panchayat",
        localities: ["Alnavar Town", "Kadabagatti", "Kumbharwada"]
      },
      "Annigeri": {
        pincode: "582201",
        jurisdiction: "panchayat",
        localities: ["Annigeri Historic Town", "Managundi", "Nalatwad"]
      }
    }
  },
  "Tumakuru": {
    taluks: {
      "Tumakuru Taluk": {
        pincode: "572101",
        jurisdiction: "municipal",
        localities: ["Siddaganga Mutt Enclave", "Batawadi", "Kyatsandra", "Sira Gate", "Gandhinagar", "Vasanthanarasapura"]
      },
      "Tiptur": {
        pincode: "572201",
        jurisdiction: "municipal",
        localities: ["Tiptur Coconut Market", "Halenahalli", "Kikkeri", "Nonavinakere"]
      },
      "Kunigal": {
        pincode: "572130",
        jurisdiction: "revenue",
        localities: ["Kunigal Stud Farm Area", "Hutridurga", "Yediyur", "Amruthur"]
      },
      "Madhugiri": {
        pincode: "572132",
        jurisdiction: "revenue",
        localities: ["Monolithic Fort Road", "Kodigenahalli", "Midigeshi", "Puravara"]
      },
      "Sira": {
        pincode: "572137",
        jurisdiction: "revenue",
        localities: ["Sira Fort Enclave", "Bukkapatna", "Kallambella", "Boranakanive"]
      },
      "Gubbi": {
        pincode: "572216",
        jurisdiction: "revenue",
        localities: ["Gubbi Town", "HAL Helicopter Complex", "C.S. Pura", "Kallur"]
      },
      "Koratagere": {
        pincode: "572129",
        jurisdiction: "revenue",
        localities: ["Goravanahalli Temple Area", "Kolala", "Holavanahalli", "Theetha"]
      },
      "Pavagada": {
        pincode: "561202",
        jurisdiction: "revenue",
        localities: ["Solar Park Area", "Y.N. Hosakote", "Nagalamadike", "Kolar"]
      },
      "Chikkanayakanahalli": {
        pincode: "572214",
        jurisdiction: "revenue",
        localities: ["C.N. Halli", "Huliyar", "Kandikere", "Shettikere"]
      },
      "Turuvekere": {
        pincode: "572227",
        jurisdiction: "revenue",
        localities: ["Turuvekere", "Dandinashivara", "Mayasandra", "Dabbeghatta"]
      }
    }
  },
  "Shivamogga": {
    taluks: {
      "Shivamogga Taluk": {
        pincode: "577201",
        jurisdiction: "municipal",
        localities: ["Vinoba Nagar", "Gopala", "Kote", "Vidyanagar", "Savalanga Road", "Machenahalli"]
      },
      "Bhadravati": {
        pincode: "577301",
        jurisdiction: "municipal",
        localities: ["VISL Steel Plant Road", "Paper Town", "New Town", "Holehonnur"]
      },
      "Sagara": {
        pincode: "577401",
        jurisdiction: "municipal",
        localities: ["Jog Falls Road", "Keladi", "Ikkeri", "Anandapuram"]
      },
      "Thirthahalli": {
        pincode: "577432",
        jurisdiction: "revenue",
        localities: ["Kuppali", "Agumbe", "Mandagadde", "Konandur"]
      },
      "Shikaripura": {
        pincode: "577427",
        jurisdiction: "revenue",
        localities: ["Shikaripura", "Shiralkoppa", "Kaganalli", "Salur"]
      },
      "Soraba": {
        pincode: "577429",
        jurisdiction: "revenue",
        localities: ["Soraba Town", "Anavatti", "Ulavi", "Chandragutti"]
      },
      "Hosanagara": {
        pincode: "577418",
        jurisdiction: "revenue",
        localities: ["Ramachandrapura Mutt", "Nagara Fort", "Ripponpet", "Trasi"]
      }
    }
  },
  "Ballari": {
    taluks: {
      "Ballari Taluk": {
        pincode: "583101",
        jurisdiction: "municipal",
        localities: ["Cantonment", "Gandhi Nagar", "Cowlbazaar", "Fort Area", "Infantry Road"]
      },
      "Sandur": {
        pincode: "583119",
        jurisdiction: "revenue",
        localities: ["Sandur Palace Road", "Torangallu Jindal Area", "Yeshwantnagar", "Kudligi Road"]
      },
      "Siruguppa": {
        pincode: "583121",
        jurisdiction: "revenue",
        localities: ["Siruguppa Town", "Tekkalakote", "Karur", "Hatcholli"]
      },
      "Kampli": {
        pincode: "583132",
        jurisdiction: "panchayat",
        localities: ["Kampli Fort", "Devalapura", "Metri", "Sugarcane Belt"]
      },
      "Kurugodu": {
        pincode: "583116",
        jurisdiction: "panchayat",
        localities: ["Kurugodu Temple Street", "Kudithini", "Kolur", "Bhairadevanahalli"]
      }
    }
  },
  "Vijayanagara": {
    taluks: {
      "Hosapete": {
        pincode: "583201",
        jurisdiction: "municipal",
        localities: ["TB Dam Colony", "Hampi Heritage Zone", "Chitrawadgi", "College Road", "Kamalapura"]
      },
      "Harapanahalli": {
        pincode: "583131",
        jurisdiction: "revenue",
        localities: ["Harapanahalli Town", "Teligi", "Chigateri", "Halavagalu"]
      },
      "Hagaribommanahalli": {
        pincode: "583212",
        jurisdiction: "revenue",
        localities: ["H.B. Halli", "Malvi", "Kotehal", "Bannigola"]
      },
      "Kotturu": {
        pincode: "583134",
        jurisdiction: "revenue",
        localities: ["Guru Kottureshwara Area", "Chiribi", "Alaburu", "Kudligi Gate"]
      },
      "Kudligi": {
        pincode: "583135",
        jurisdiction: "revenue",
        localities: ["Kudligi", "Gudekote Sloth Sanctuary", "Chirathagundu", "Hosa Halli"]
      },
      "Hadagali": {
        pincode: "583219",
        jurisdiction: "revenue",
        localities: ["Hoovina Hadagali", "Hirehadagali", "Ittagi", "Sogi"]
      }
    }
  },
  "Mandya": {
    taluks: {
      "Mandya Taluk": {
        pincode: "571401",
        jurisdiction: "municipal",
        localities: ["Sugar Town", "Subhash Nagar", "Kallahalli", "Guthalu", "Keragodu", "Induvalu"]
      },
      "Maddur": {
        pincode: "571428",
        jurisdiction: "revenue",
        localities: ["Maddur Vada Hub", "Shivapura Satyagraha Soudha", "Koppa", "Besagarahalli", "Ataguru"]
      },
      "Malavalli": {
        pincode: "571430",
        jurisdiction: "revenue",
        localities: ["Shivanasamudra Falls Area", "Belakavadi", "Halaguru", "Kirugavalu"]
      },
      "Srirangapatna": {
        pincode: "571438",
        jurisdiction: "municipal",
        localities: ["Tipu Sultan Fort", "Ranganathaswamy Temple", "Ganjam", "KRS Dam Road", "Arakere"]
      },
      "Pandavapura": {
        pincode: "571434",
        jurisdiction: "revenue",
        localities: ["Melukote Temple Town", "French Rocks", "Jakkanahalli", "Chinya"]
      },
      "Krishnarajpet": {
        pincode: "571426",
        jurisdiction: "revenue",
        localities: ["K.R. Pet Town", "Triveni Sangama Kikkeri", "Sindhuvalli", "Seelanere"]
      },
      "Nagamangala": {
        pincode: "571432",
        jurisdiction: "revenue",
        localities: ["Nagamangala", "Adichunchanagiri Hill Road", "Belluru", "Bindiganavile"]
      }
    }
  },
  "Hassan": {
    taluks: {
      "Hassan Taluk": {
        pincode: "573201",
        jurisdiction: "municipal",
        localities: ["Hassan Master Control Facility Road", "Vidyanagar", "Shanthigrama", "Kattaya", "Gorur Dam Road"]
      },
      "Belur": {
        pincode: "573115",
        jurisdiction: "municipal",
        localities: ["Chennakeshava Temple Area", "Halebeedu Road", "Arehalli", "Bikkodu"]
      },
      "Halebeedu": {
        pincode: "573121",
        jurisdiction: "panchayat",
        localities: ["Hoysaleshwara Temple Area", "Chattihalli", "Hagare", "Dwarasamudra"]
      },
      "Sakleshpur": {
        pincode: "573134",
        jurisdiction: "revenue",
        localities: ["Coffee Plantation Corridor", "Manjarabad Fort", "Yeslur", "Hettur", "Hanbal"]
      },
      "Channarayapatna": {
        pincode: "573116",
        jurisdiction: "revenue",
        localities: ["Shravanabelagola", "Nuggehalli", "Hirisave", "Bagur"]
      },
      "Arsikere": {
        pincode: "573103",
        jurisdiction: "municipal",
        localities: ["Arsikere Junction Area", "Kanakatte", "Banasandra", "Javagal"]
      },
      "Arkalgud": {
        pincode: "573102",
        jurisdiction: "revenue",
        localities: ["Arkalgud Town", "Konanur", "Ramanathapura", "Mallipatna"]
      },
      "Alur": {
        pincode: "573213",
        jurisdiction: "revenue",
        localities: ["Alur Town", "Palya", "Kenchammana Hosakote", "Kundur"]
      },
      "Holenarasipura": {
        pincode: "573211",
        jurisdiction: "revenue",
        localities: ["Hemavathi Riverfront", "Halekote", "Channarayapatna Road", "Paduvalahippe"]
      }
    }
  },
  "Chikkamagaluru": {
    taluks: {
      "Chikkamagaluru Taluk": {
        pincode: "577101",
        jurisdiction: "municipal",
        localities: ["Mullayanagiri Foot", "KM Road", "Rathnagiri Road", "Indavara", "Vastare"]
      },
      "Mudigere": {
        pincode: "577132",
        jurisdiction: "revenue",
        localities: ["Kottigehara", "Kalasa Road", "Gonibeedu", "Banakal"]
      },
      "Koppa": {
        pincode: "577126",
        jurisdiction: "revenue",
        localities: ["Koppa Town", "Hariharapura", "Bhandigadi", "Jayapura"]
      },
      "Sringeri": {
        pincode: "577139",
        jurisdiction: "revenue",
        localities: ["Sharada Peetham Enclave", "Kigga", "Nemmar", "Vidyaranyapura"]
      },
      "Tarikere": {
        pincode: "577228",
        jurisdiction: "revenue",
        localities: ["Kemmangundi Road", "Lakkavalli", "Ajjampura Gate", "Lingadahalli"]
      },
      "Kadur": {
        pincode: "577548",
        jurisdiction: "revenue",
        localities: ["Kadur Town", "Birur Junction", "Sakrepatna", "Singatagere"]
      },
      "Narasimharajapura": {
        pincode: "577134",
        jurisdiction: "revenue",
        localities: ["N.R. Pura", "Balehonnur", "Muthinakoppa", "Menase"]
      },
      "Kalasa": {
        pincode: "577124",
        jurisdiction: "panchayat",
        localities: ["Kalaseshwara Temple", "Horanadu Annapoorneshwari", "Balur", "Kudremukh Road"]
      },
      "Ajjampura": {
        pincode: "577547",
        jurisdiction: "panchayat",
        localities: ["Ajjampura Town", "Shivani", "Bukkambudi", "Hirenallur"]
      }
    }
  },
  "Kodagu": {
    taluks: {
      "Madikeri": {
        pincode: "571201",
        jurisdiction: "municipal",
        localities: ["Madikeri Fort", "Raja Seat Area", "Stuart Hill", "Murnad", "Sampaje"]
      },
      "Virajpet": {
        pincode: "571218",
        jurisdiction: "revenue",
        localities: ["Virajpet Town", "Gonikoppal", "Ammathi", "Ponnampet Road"]
      },
      "Somwarpet": {
        pincode: "571236",
        jurisdiction: "revenue",
        localities: ["Somwarpet Town", "Kushalnagar", "Shanivarasanthe", "Suntikoppa"]
      },
      "Ponnampet": {
        pincode: "571216",
        jurisdiction: "revenue",
        localities: ["Ponnampet", "Hudikeri", "Kutta", "Balele"]
      },
      "Kushalnagar": {
        pincode: "571234",
        jurisdiction: "municipal",
        localities: ["Bylakuppe Golden Temple", "Harangi Dam Road", "Mullusoge", "Koppa Bridge"]
      }
    }
  },
  "Kolar": {
    taluks: {
      "Kolar Taluk": {
        pincode: "563101",
        jurisdiction: "municipal",
        localities: ["Kolar Gold Corridor", "Keelu Kote", "Hulkur", "Sugatur", "Vemagal Industrial Area"]
      },
      "Bangarapet": {
        pincode: "563114",
        jurisdiction: "revenue",
        localities: ["Bangarapet Town", "Desihalli", "Kammasandra", "Budikote"]
      },
      "KGF (Robertsonpet)": {
        pincode: "563122",
        jurisdiction: "municipal",
        localities: ["Champion Reefs", "Oorgaum", "Marikuppam", "Coromandel", "Andersonpet"]
      },
      "Malur": {
        pincode: "563130",
        jurisdiction: "revenue",
        localities: ["Malur Industrial Estate", "Lakkur", "Masti", "Tekal"]
      },
      "Mulbagal": {
        pincode: "563131",
        jurisdiction: "revenue",
        localities: ["Mulbagal Town", "Avani Hill", "Kurudumale", "Duggasandra"]
      },
      "Srinivaspur": {
        pincode: "563135",
        jurisdiction: "revenue",
        localities: ["Mango Market Enclave", "Yeldur", "Ronur", "Rayalpadu"]
      }
    }
  },
  "Chikkaballapura": {
    taluks: {
      "Chikkaballapura Taluk": {
        pincode: "562101",
        jurisdiction: "municipal",
        localities: ["Nandi Hills Road", "Kandavara", "Muddenahalli (Visvesvaraya Samadhi)", "Peresandra"]
      },
      "Bagepalli": {
        pincode: "561207",
        jurisdiction: "revenue",
        localities: ["Bagepalli Town", "Chelur", "Pathapalya", "Guluru"]
      },
      "Chintamani": {
        pincode: "563125",
        jurisdiction: "municipal",
        localities: ["Chintamani Town", "Muragamalla Dargah", "Ambajidurga", "Kaidala"]
      },
      "Gowribidanur": {
        pincode: "561208",
        jurisdiction: "revenue",
        localities: ["Vidurashwatha", "Thondebhavi Industrial", "Nagaragere", "Manchenahalli"]
      },
      "Sidlaghatta": {
        pincode: "562105",
        jurisdiction: "revenue",
        localities: ["Silk Cocoon Market", "Jangamakote", "Melur", "Sadali"]
      },
      "Chelur": {
        pincode: "563124",
        jurisdiction: "panchayat",
        localities: ["Chelur Central", "Chakavelu", "Puligal", "Nallaguttapalli"]
      }
    }
  },
  "Kalaburagi": {
    taluks: {
      "Kalaburagi Taluk": {
        pincode: "585101",
        jurisdiction: "municipal",
        localities: ["Sharanabasaveshwar Temple Area", "Brahampur", "MSK Mill Area", "Sedam Road", "GDA Colony"]
      },
      "Aland": {
        pincode: "585302",
        jurisdiction: "revenue",
        localities: ["Aland Town", "Narona", "Khajuri", "Madan Hipparga"]
      },
      "Afzalpur": {
        pincode: "585301",
        jurisdiction: "revenue",
        localities: ["Afzalpur", "Ganagapur Dattatreya Temple", "Gobbur", "Mashal"]
      },
      "Chincholi": {
        pincode: "585307",
        jurisdiction: "revenue",
        localities: ["Chincholi Wildlife Sanctuary Area", "Sulepet", "Ainoli", "Kunchavaram"]
      },
      "Chittapur": {
        pincode: "585211",
        jurisdiction: "revenue",
        localities: ["Wadi Cement Belt", "Nalwar", "Sannati Buddhist Site", "Shahabad"]
      },
      "Jevargi": {
        pincode: "585310",
        jurisdiction: "revenue",
        localities: ["Jevargi Town", "Andola", "Yedrami", "Nelogi"]
      },
      "Sedam": {
        pincode: "585222",
        jurisdiction: "revenue",
        localities: ["Sedam Town", "Mudhul", "Kurkunta", "Kolkur"]
      },
      "Shahabad": {
        pincode: "585229",
        jurisdiction: "municipal",
        localities: ["Shahabad Cement Town", "Bhankur", "Hongunta", "Ravoor"]
      },
      "Kalagi": {
        pincode: "585312",
        jurisdiction: "panchayat",
        localities: ["Kalagi", "Rathkal", "Korwar", "Hogarnal"]
      },
      "Kamalapur": {
        pincode: "585313",
        jurisdiction: "panchayat",
        localities: ["Kamalapur", "Mahagaon", "Degaon", "Okali"]
      },
      "Yedrami": {
        pincode: "585325",
        jurisdiction: "panchayat",
        localities: ["Yedrami Town", "Malla", "Ijeri", "Bilwar"]
      }
    }
  },
  "Bidar": {
    taluks: {
      "Bidar Taluk": {
        pincode: "585401",
        jurisdiction: "municipal",
        localities: ["Bahmani Fort Area", "Gurudwara Nanak Jhira", "Mahmood Gawan Madrasa", "Chidri", "Naubad"]
      },
      "Basavakalyan": {
        pincode: "585327",
        jurisdiction: "municipal",
        localities: ["Anubhava Mantapa", "Basaveshwara Temple", "Tripurant", "Mudbi"]
      },
      "Bhalki": {
        pincode: "585328",
        jurisdiction: "revenue",
        localities: ["Hiremath Area", "Mehkar", "Khatak Chincholi", "Halbarga"]
      },
      "Humnabad": {
        pincode: "585330",
        jurisdiction: "revenue",
        localities: ["Maniknagar", "Dubalgundi", "Hallikhed", "Chitguppa"]
      },
      "Aurad": {
        pincode: "585326",
        jurisdiction: "revenue",
        localities: ["Aurad Town", "Kamalnagar", "Santpur", "Kushnoor"]
      },
      "Chitguppa": {
        pincode: "585412",
        jurisdiction: "revenue",
        localities: ["Chitguppa Town", "Bemalkheda", "Chintaki", "Udbal"]
      },
      "Kamalnagar": {
        pincode: "585417",
        jurisdiction: "panchayat",
        localities: ["Kamalnagar Central", "Thana Kushnoor", "Torna", "Dongaon"]
      }
    }
  },
  "Raichur": {
    taluks: {
      "Raichur Taluk": {
        pincode: "584101",
        jurisdiction: "municipal",
        localities: ["Raichur Thermal Power Colony", "Fort Area", "Station Road", "Askihal", "Gunj"]
      },
      "Manvi": {
        pincode: "584123",
        jurisdiction: "revenue",
        localities: ["Manvi Town", "Sirwar", "Pothnal", "Kurdi"]
      },
      "Sindhanur": {
        pincode: "584128",
        jurisdiction: "municipal",
        localities: ["Sindhanur Paddy Hub", "Jawalgere", "Turvihal", "Gorebal"]
      },
      "Devadurga": {
        pincode: "584111",
        jurisdiction: "revenue",
        localities: ["Devadurga", "Arakere", "Gabbur", "Jalahalli"]
      },
      "Lingsugur": {
        pincode: "584122",
        jurisdiction: "revenue",
        localities: ["Lingsugur", "Mudgal Fort", "Maski Ashokan Edict", "Hutti Gold Mines"]
      },
      "Maski": {
        pincode: "584124",
        jurisdiction: "revenue",
        localities: ["Maski Town", "Antharagangi", "Medikinahal", "Hirekadalagere"]
      },
      "Sirwar": {
        pincode: "584129",
        jurisdiction: "panchayat",
        localities: ["Sirwar Cotton Hub", "Kallur", "Mallat", "Lakkandinni"]
      }
    }
  },
  "Koppal": {
    taluks: {
      "Koppal Taluk": {
        pincode: "583231",
        jurisdiction: "municipal",
        localities: ["Koppal Fort", "Gavisiddeshwara Mutt", "Kinnal Toy Artisan Colony", "Bhagyanagar", "Halavarthi"]
      },
      "Gangavathi": {
        pincode: "583227",
        jurisdiction: "municipal",
        localities: ["Anegundi Historic Zone", "Kishkinda / Pampa Sarovar", "Karatagi Road", "Marali"]
      },
      "Kushtagi": {
        pincode: "583277",
        jurisdiction: "revenue",
        localities: ["Kushtagi", "Tawargera", "Hanamsagar", "Dotihal"]
      },
      "Yelburga": {
        pincode: "583236",
        jurisdiction: "revenue",
        localities: ["Yelburga", "Kukanoor", "Bannikoppa", "Hirewaddatti"]
      },
      "Karatagi": {
        pincode: "583229",
        jurisdiction: "revenue",
        localities: ["Karatagi Paddy Mill Zone", "Siddapur", "Mylarapura", "Gunduru"]
      },
      "Kukanoor": {
        pincode: "583232",
        jurisdiction: "panchayat",
        localities: ["Kukanoor Mahadeva Temple", "Itagi Bhimambika", "Mandalagere"]
      }
    }
  },
  "Gadag": {
    taluks: {
      "Gadag-Betageri": {
        pincode: "582101",
        jurisdiction: "municipal",
        localities: ["Trikuteshwara Temple Road", "Panchakshari Gawai Colony", "Veeranarayana Area", "Pala Badami Road"]
      },
      "Lakshmeshwara": {
        pincode: "582116",
        jurisdiction: "revenue",
        localities: ["Someshwara Temple", "Doddagaddi", "Balehonnur Road", "Suranagi"]
      },
      "Ronn": {
        pincode: "582209",
        jurisdiction: "revenue",
        localities: ["Ronn Town", "Gajendragad Fort", "Naregal", "Kotumachagi"]
      },
      "Shirhatti": {
        pincode: "582120",
        jurisdiction: "revenue",
        localities: ["Fakirreshwar Mutt", "Magadi Bird Sanctuary", "Belahatti", "Hebbal"]
      },
      "Mundargi": {
        pincode: "582118",
        jurisdiction: "revenue",
        localities: ["Kappatagudda Hills Foot", "Dambal Temple Town", "Singatalur", "Hesarur"]
      },
      "Gajendragad": {
        pincode: "582114",
        jurisdiction: "revenue",
        localities: ["Gajendragad Handloom Cluster", "Unachageri", "Rajur", "Musalagere"]
      }
    }
  },
  "Chitradurga": {
    taluks: {
      "Chitradurga Taluk": {
        pincode: "577501",
        jurisdiction: "municipal",
        localities: ["Seven-Ring Fort Area", "Onake Obavva Circle", "Kelagote", "Medehalli", "Ingaldhal Copper Mines"]
      },
      "Challakere": {
        pincode: "577522",
        jurisdiction: "revenue",
        localities: ["DRDO / Science City Area", "Oil City Market", "Parasurampura", "Talaku"]
      },
      "Hiriyur": {
        pincode: "577598",
        jurisdiction: "revenue",
        localities: ["Vani Vilasa Sagara Dam", "Babbur Farm", "Aimangala", "Dharmapura"]
      },
      "Holalkere": {
        pincode: "577526",
        jurisdiction: "revenue",
        localities: ["Ganapathi Temple Area", "Ramagiri", "Chitralli", "Talya"]
      },
      "Hosadurga": {
        pincode: "577527",
        jurisdiction: "revenue",
        localities: ["Hosadurga Town", "Jankal", "Mathodu", "Baguru"]
      },
      "Molakalmuru": {
        pincode: "577535",
        jurisdiction: "revenue",
        localities: ["Molakalmuru Silk Saree Cluster", "Brahmagiri Ashokan Edict", "B.G. Kere", "Rayapura"]
      }
    }
  },
  "Davanagere": {
    taluks: {
      "Davanagere Taluk": {
        pincode: "577001",
        jurisdiction: "municipal",
        localities: ["Benne Dosa Street / Old Town", "MCC Colony", "Vidyanagar", "DCM Township", "Hadadi Road", "Avaragere"]
      },
      "Harihara": {
        pincode: "577601",
        jurisdiction: "municipal",
        localities: ["Harihareshwara Temple", "Polyfibres Area", "Bannikodu", "Kumsi", "Malebennur"]
      },
      "Channagiri": {
        pincode: "577213",
        jurisdiction: "revenue",
        localities: ["Channagiri Fort", "Santhebennur Pushkarini", "Hodigere", "Basavapatna"]
      },
      "Honnali": {
        pincode: "577217",
        jurisdiction: "revenue",
        localities: ["Tunga-Bhadra Sangama", "Sasvehalli", "Belimalluru", "Kulambi"]
      },
      "Jagalur": {
        pincode: "577528",
        jurisdiction: "revenue",
        localities: ["Jagalur Town", "Bilahal", "Sokke", "Asagodu"]
      },
      "Nyamathi": {
        pincode: "577223",
        jurisdiction: "panchayat",
        localities: ["Nyamathi Town", "Suragondanakoppa", "Chilur", "Jeenahalli"]
      }
    }
  },
  "Haveri": {
    taluks: {
      "Haveri Taluk": {
        pincode: "581110",
        jurisdiction: "municipal",
        localities: ["Cardamom Market", "Siddheshwara Temple", "Guttal", "Devagiri", "Kaginele Kanaka Guru Peetha"]
      },
      "Ranebennur": {
        pincode: "581115",
        jurisdiction: "municipal",
        localities: ["Blackbuck Sanctuary", "Seed Industry Hub", "Medleri", "Halageri", "Chowdadampur"]
      },
      "Byadgi": {
        pincode: "581106",
        jurisdiction: "revenue",
        localities: ["Byadgi Red Chilli Market Yard", "Kaginele Road", "Mallur", "Motebennur"]
      },
      "Hangal": {
        pincode: "581104",
        jurisdiction: "revenue",
        localities: ["Tarakeshwara Temple", "Akki-Alur", "Adur", "Tilavalli"]
      },
      "Shiggaon": {
        pincode: "581205",
        jurisdiction: "revenue",
        localities: ["Shiggaon Town", "Bankapur Peacock Sanctuary", "Tadas", "Dhundi"]
      },
      "Savanur": {
        pincode: "581118",
        jurisdiction: "revenue",
        localities: ["Nawab Palace Road", "Baobab Trees Enclave", "Hattimattur", "Karada"]
      },
      "Hirekerur": {
        pincode: "581111",
        jurisdiction: "revenue",
        localities: ["Sarvajna Birthplace Area", "Rattihalli", "Hamsabhavi", "Chikkakerur"]
      },
      "Rattihalli": {
        pincode: "581116",
        jurisdiction: "panchayat",
        localities: ["Rattihalli Town", "Kadime", "Hallur", "Katenahalli"]
      }
    }
  },
  "Bagalkot": {
    taluks: {
      "Bagalkot Taluk": {
        pincode: "587101",
        jurisdiction: "municipal",
        localities: ["Navanagar Re-settlement Area", "Vidyagiri", "Old Town", "Muchakhandi", "Kaladgi"]
      },
      "Badami": {
        pincode: "587201",
        jurisdiction: "municipal",
        localities: ["Cave Temples Heritage Zone", "Agastya Lake Area", "Pattadakal Road", "Mahakuta", "Guledgudda"]
      },
      "Hungund": {
        pincode: "587118",
        jurisdiction: "revenue",
        localities: ["Aihole UNESCO Enclave", "Kudalasangama Sangameshwar", "Aminagad", "Ilkal Saree Town"]
      },
      "Jamkhandi": {
        pincode: "587301",
        jurisdiction: "municipal",
        localities: ["Pategar Palace Road", "Rabkavi Banhatti", "Kavalagudda", "Tudalagaddi"]
      },
      "Mudhol": {
        pincode: "587313",
        jurisdiction: "revenue",
        localities: ["Mudhol Hound Native Zone", "Ranna Memorial", "Lokapur", "Mahalingpur"]
      },
      "Bilagi": {
        pincode: "587116",
        jurisdiction: "revenue",
        localities: ["Bilagi Town", "Galagali", "Kundaragi", "Badagandi"]
      },
      "Ilkal": {
        pincode: "587125",
        jurisdiction: "municipal",
        localities: ["Granite Export Hub", "Kanti Galli", "Balkundi", "Gorgere"]
      },
      "Rabkavi Banhatti": {
        pincode: "587311",
        jurisdiction: "municipal",
        localities: ["Weavers Colony", "Asangi", "Rampur", "Hosur"]
      },
      "Guledgudda": {
        pincode: "587203",
        jurisdiction: "revenue",
        localities: ["Khana Textile Cluster", "Kotikal", "Hulageri", "Katarki"]
      }
    }
  },
  "Vijayapura": {
    taluks: {
      "Vijayapura Taluk": {
        pincode: "586101",
        jurisdiction: "municipal",
        localities: ["Gol Gumbaz Heritage Zone", "Ibrahim Rauza", "Station Road", "Jorapur Peth", "Navarasapur"]
      },
      "Basavana Bagewadi": {
        pincode: "586203",
        jurisdiction: "revenue",
        localities: ["Basaveshwara Birthplace", "Nidagundi", "Managoli", "Kolhar"]
      },
      "Indi": {
        pincode: "586209",
        jurisdiction: "revenue",
        localities: ["Indi Town", "Horti", "Zalki", "Lachyan"]
      },
      "Muddebihal": {
        pincode: "586212",
        jurisdiction: "revenue",
        localities: ["Muddebihal", "Talikoti Historic Battle Ground", "Dhavalagi", "Nalatwad"]
      },
      "Sindagi": {
        pincode: "586128",
        jurisdiction: "revenue",
        localities: ["Sindagi Town", "Almel", "Devarahipparagi", "Kerur"]
      },
      "Talikoti": {
        pincode: "586214",
        jurisdiction: "revenue",
        localities: ["Talikoti Town", "Minajagi", "Hadaginal", "Fatehpur"]
      },
      "Babaleshwar": {
        pincode: "586113",
        jurisdiction: "panchayat",
        localities: ["Babaleshwar", "Tikota Grape Valley", "Kanakadasa Badavane", "Bellubbi"]
      },
      "Kolhar": {
        pincode: "586210",
        jurisdiction: "panchayat",
        localities: ["Kolhar Curd Market", "Kumathe", "Ronihal", "Hangaragi"]
      },
      "Nidagundi": {
        pincode: "586213",
        jurisdiction: "panchayat",
        localities: ["Almatti Dam Road", "Benal", "Abbihal", "Golasangi"]
      },
      "Tikota": {
        pincode: "586130",
        jurisdiction: "panchayat",
        localities: ["Tikota Vineyard Corridor", "Toravi Navarasapur", "Kotyal", "Danadagi"]
      },
      "Devara Hipparagi": {
        pincode: "586115",
        jurisdiction: "panchayat",
        localities: ["Hipparagi Town", "Kalkeri", "Moratagi", "Padaganur"]
      },
      "Chadchan": {
        pincode: "586205",
        jurisdiction: "panchayat",
        localities: ["Chadchan Textile Market", "Umrani", "Ravalgaon", "Dharangond"]
      }
    }
  },
  "Uttara Kannada": {
    taluks: {
      "Karwar": {
        pincode: "581301",
        jurisdiction: "municipal",
        localities: ["INS Kadamba Naval Base Enclave", "Rabindranath Tagore Beach", "Habbuwada", "Baithkol", "Sadashivgad"]
      },
      "Ankola": {
        pincode: "581314",
        jurisdiction: "revenue",
        localities: ["Ankola Town", "Belekeri Port", "Hattikeri", "Sunksal"]
      },
      "Kumta": {
        pincode: "581343",
        jurisdiction: "municipal",
        localities: ["Kumta Town", "Aghanashini Estuary", "Mirjan Fort", "Dhareshwar", "Baad"]
      },
      "Bhatkal": {
        pincode: "581320",
        jurisdiction: "municipal",
        localities: ["Murudeshwara Shiva Temple", "Bhatkal Port", "Shirali", "Jali", "Mundalli"]
      },
      "Sirsi": {
        pincode: "581401",
        jurisdiction: "municipal",
        localities: ["Marikamba Temple", "Banavasi Ancient Capital", "Unchalli Falls Road", "Yellapur Gate"]
      },
      "Siddapur": {
        pincode: "581355",
        jurisdiction: "revenue",
        localities: ["Arecanut Estate Corridor", "Bilgi", "Kansur", "Tyagarthi"]
      },
      "Yellapur": {
        pincode: "581359",
        jurisdiction: "revenue",
        localities: ["Magod Falls Road", "Manchikeri", "Kirwatti", "Idgundi"]
      },
      "Haliyal": {
        pincode: "581329",
        jurisdiction: "revenue",
        localities: ["Haliyal Sugar Mill Area", "Tergaon", "Bhagavati", "Sambrani"]
      },
      "Dandeli": {
        pincode: "581325",
        jurisdiction: "municipal",
        localities: ["Kali River Rafting Corridor", "West Coast Paper Mills Area", "Ambikanagar", "Kanshidag"]
      },
      "Joida (Supa)": {
        pincode: "581186",
        jurisdiction: "revenue",
        localities: ["Anshi Tiger Reserve Foot", "Supa Dam", "Castlerock", "Ulavi Channabasaveshwara"]
      },
      "Honnavar": {
        pincode: "581334",
        jurisdiction: "revenue",
        localities: ["Sharavathi Estuary", "Apsarakonda", "Kasarkod Eco Beach", "Manki", "Gerosoppa"]
      }
    }
  },
  "Chamarajanagar": {
    taluks: {
      "Chamarajanagar Taluk": {
        pincode: "571313",
        jurisdiction: "municipal",
        localities: ["Chamarajeshwara Temple", "Ramasamudra", "Santhemarahalli", "Kagalvadi", "Galigowdanahalli"]
      },
      "Gundlupet": {
        pincode: "571111",
        jurisdiction: "revenue",
        localities: ["Bandipur Tiger Reserve Gateway", "Himavad Gopalaswamy Betta", "Begur", "Terakanambi"]
      },
      "Kollegal": {
        pincode: "571440",
        jurisdiction: "municipal",
        localities: ["Silk Handloom Hub", "Malamadagu", "Singanallur", "Kamagere", "Kunthur"]
      },
      "Yelandur": {
        pincode: "571441",
        jurisdiction: "revenue",
        localities: ["BR Hills Forest Corridor", "Agara", "Gowdahalli", "Mamballi"]
      },
      "Hanur": {
        pincode: "571439",
        jurisdiction: "revenue",
        localities: ["Male Mahadeshwara Hills", "Hogenakkal Border Road", "Cowdalli", "Lokkanahalli"]
      }
    }
  },
  "Yadgir": {
    taluks: {
      "Yadgir Taluk": {
        pincode: "585201",
        jurisdiction: "municipal",
        localities: ["Hill Fort Road", "Chittapur Gate", "Hattikuni Dam Road", "Balichakra", "Ganj"]
      },
      "Shahapur": {
        pincode: "585223",
        jurisdiction: "revenue",
        localities: ["Sleeping Buddha Hill Area", "Gogipeth", "Dornahalli", "Sagar"]
      },
      "Shorapur": {
        pincode: "585224",
        jurisdiction: "revenue",
        localities: ["Shorapur Fort Road", "Kembhavi", "Tintani Mouneshwara", "Hunasagi Road"]
      },
      "Hunasagi": {
        pincode: "585215",
        jurisdiction: "revenue",
        localities: ["Hunasagi Town", "Narayanpur Dam Area", "Wadagera Road", "Kodekal"]
      },
      "Wadagera": {
        pincode: "585355",
        jurisdiction: "panchayat",
        localities: ["Wadagera", "Bhimarayanagudi", "Konkal", "Tumkur"]
      },
      "Gurmitkal": {
        pincode: "585214",
        jurisdiction: "revenue",
        localities: ["Gurmitkal Silk Cluster", "Chintanapalli", "Yanagundi", "Gajarkot"]
      }
    }
  }
};

/**
 * Helper Utilities
 */
export function getAllDistricts() {
  return Object.keys(KARNATAKA_LOCATION_DATA).sort();
}

export function getTaluksForDistrict(district) {
  if (!district || !KARNATAKA_LOCATION_DATA[district]) return [];
  return Object.keys(KARNATAKA_LOCATION_DATA[district].taluks).sort();
}

export function getLocalitiesForTaluk(district, taluk) {
  if (!district || !taluk) return [];
  const dist = KARNATAKA_LOCATION_DATA[district];
  if (!dist || !dist.taluks || !dist.taluks[taluk]) return [];
  return dist.taluks[taluk].localities || [];
}

export function getTalukMetadata(district, taluk) {
  if (!district || !taluk) return null;
  const dist = KARNATAKA_LOCATION_DATA[district];
  if (!dist || !dist.taluks || !dist.taluks[taluk]) return null;
  return dist.taluks[taluk];
}
