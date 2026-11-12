// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-research",
          title: "research",
          description: "Certificates that prove autonomous systems safe, and proofs a computer can check.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/research/";
          },
        },{id: "nav-publications",
          title: "publications",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-cv",
          title: "cv",
          description: "CV.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "nav-teaching",
          title: "teaching",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/teaching/";
          },
        },{id: "post-google-gemini-updates-flash-1-5-gemma-2-and-project-astra",
        
          title: 'Google Gemini updates: Flash 1.5, Gemma 2 and Project Astra <svg width="1.2rem" height="1.2rem" top=".5rem" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M17 13.5v6H5v-12h6m3-3h6v6m0-6-9 9" class="icon_svg-stroke" stroke="#999" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
        
        description: "We’re sharing updates across our Gemini family of models and a glimpse of Project Astra, our vision for the future of AI assistants.",
        section: "Posts",
        handler: () => {
          
            window.open("https://blog.google/technology/ai/google-gemini-update-flash-ai-assistant-io-2024/", "_blank");
          
        },
      },{id: "post-displaying-external-posts-on-your-al-folio-blog",
        
          title: 'Displaying External Posts on Your al-folio Blog <svg width="1.2rem" height="1.2rem" top=".5rem" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M17 13.5v6H5v-12h6m3-3h6v6m0-6-9 9" class="icon_svg-stroke" stroke="#999" stroke-width="1.5" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.open("https://medium.com/@al-folio/displaying-external-posts-on-your-al-folio-blog-b60a1d241a0a?source=rss-17feae71c3c4------2", "_blank");
          
        },
      },{id: "books-the-godfather",
          title: 'The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_godfather/";
            },},{id: "news-presented-our-hscc-paper-successive-control-barrier-functions-for-nonlinear-systems-at-cps-iot-week-held-in-irvine-ca-slides-here",
          title: 'Presented our HSCC paper, “Successive Control Barrier Functions for Nonlinear Systems,” at CPS-IoT...',
          description: "",
          section: "News",},{id: "news-successfully-defended-my-ph-d-thesis-proposal-successive-control-certificates-for-safe-autonomy",
          title: 'Successfully defended my Ph.D. thesis proposal, Successive Control Certificates for Safe Autonomy!',
          description: "",
          section: "News",},{id: "news-organized-the-inaugural-cuplv-formal-methods-seminar-and-gave-a-talk-on-verification-of-real-valued-programs",
          title: 'Organized the inaugural CUPLV Formal Methods Seminar and gave a talk on Verification...',
          description: "",
          section: "News",},{id: "news-presented-a-poster-at-the-cu-annual-research-expo-titled-sos-certificate-repair-via-dsos-and-rational-lp",
          title: 'Presented a poster at the CU annual research expo titled SOS Certificate Repair...',
          description: "",
          section: "News",},{id: "news-successfully-defended-my-ph-d-dissertation-titled-successive-control-certificates-for-safe-autonomy-tada-recording-here",
          title: 'Successfully defended my Ph.D. dissertation titled, “Successive Control Certificates for Safe Autonomy” :tada:....',
          description: "",
          section: "News",},{id: "news-our-work-titled-control-barrier-functions-for-moving-obstacles-via-translational-symmetry-accepted-as-a-regular-paper-at-ieee-cdc-2026",
          title: 'Our work titled “Control Barrier Functions for Moving Obstacles via Translational Symmetry” accepted...',
          description: "",
          section: "News",},{id: "news-new-research-pages-with-interactive-demos-of-successive-barriers-repulsive-barriers-successive-clfs-and-exact-sos-certificate-repair",
          title: 'New research pages with interactive demos of successive barriers, repulsive barriers, successive CLFs...',
          description: "",
          section: "News",},{id: "projects-exact-sos-certificates",
          title: 'Exact SOS certificates',
          description: "Repairing floating-point SOS solutions into exact certificates a proof assistant can check.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/exact-certificates/";
            },},{id: "projects-repulsive-barriers",
          title: 'Repulsive barriers',
          description: "One certificate, synthesized in the obstacle&#39;s frame, reused wherever the obstacle goes.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/repulsive-barriers/";
            },},{id: "projects-successive-barriers",
          title: 'Successive barriers',
          description: "Stacking barrier certificates, level by level, to certify far more of the state space.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/successive-barriers/";
            },},{id: "projects-successive-clfs",
          title: 'Successive CLFs',
          description: "Chaining control Lyapunov functions to reach a goal through clutter.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/successive-clfs/";
            },},{
        id: 'social-cv',
        title: 'CV',
        section: 'Socials',
        handler: () => {
          window.open("/assets/pdf/cv_rameez_wajid_research-5.pdf", "_blank");
        },
      },{
        id: 'social-dblp',
        title: 'DBLP',
        section: 'Socials',
        handler: () => {
          window.open("https://dblp.org/pid/138/2547.html", "_blank");
        },
      },{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%72%61%6D%65%65%7A.%77%61%6A%69%64@%63%6F%6C%6F%72%61%64%6F.%65%64%75", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/rameezw", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/rameezw", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=CaBt90QAAAAJ", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
