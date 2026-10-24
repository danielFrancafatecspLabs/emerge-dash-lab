import { SignalFeatureCollection } from "../types/signal";

/**
 * Bundled Baseline Signals FeatureCollection with improved coordinates, jitter, and gazetteer metadata
 */
export const INITIAL_SIGNALS_GEOJSON: SignalFeatureCollection = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S08",
      "geometry": {
        "type": "Point",
        "coordinates": [
          25.47,
          65.01
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S08",
        "title": "Oulu and Tokyo fly local 5G cell on a drone",
        "date": "2026-05-26",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "UAV backhaul",
        "domain": "Technological",
        "location_type": "Lab/hospital",
        "location": "Finland; OuluZone, Oulu",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.6gflagship.com/news/researchers-from-the-university-of-oulu-and-the-university-of-tokyo-demonstrate-drone-mounted-5g-base-station-for-emergency-communications/",
        "status": "signal",
        "Details": "University of Oulu and University of Tokyo researchers demonstrated a drone carrying a compact local 5G base station plus satellite backhaul at OuluZone on 26 May 2026. They reported stable coverage at varying altitudes in simulated disaster scenarios, connecting ground users without fixed infrastructure below. Preparatory flights and propagation simulations ran in Japan; live 5G transmit tests moved to Finland because Japanese rules still restrict airborne 5G transmission.",
        "Implication": "The Japan constraint is now an explicit connectivity bottleneck; Nordic test ranges become the workaround for East Asian aerial-RAN R&D.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "FIN",
        "truth_coordinates": [
          25.47,
          65.01
        ],
        "display_coordinates": [
          25.47,
          65.01
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S16",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -98.58,
          39.83
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S16",
        "title": "Verizon standardises drone digital twins of cell sites",
        "date": "2026-05-26",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "UAV backhaul",
        "domain": "Economic",
        "location_type": "Actor HQ",
        "location": "United States",
        "confidence": "Medium",
        "stakeholder_relevance": "Medium",
        "horizon": "Now",
        "source_url": "https://insidetowers.com/verizon-takes-tower-inspections-from-climb-to-click/",
        "status": "signal",
        "Details": "Reporting on 26 May 2026 described Verizon embedding preprogrammed autonomous drones plus vHive software to build living digital twins of tens of thousands of cell sites—antennas, radios, cable runs, compounds—into standard engineering process. After storms, teams compare the twin with fresh captures; leadership cited cutting some access-blocked inspections from hours to about 15 minutes. RAD analytics add azimuth/skew; engineers click from the 3D model to full-resolution drone photos.",
        "Implication": "Network-inspection UAVs are an operating cost line, not a pilot, which pulls C2 and airspace access into MNO opex.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "USA",
        "truth_coordinates": [
          -98.58,
          39.83
        ],
        "display_coordinates": [
          -98.58,
          40.08322
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S10",
      "geometry": {
        "type": "Point",
        "coordinates": [
          18.64,
          60.13
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S10",
        "title": "Sweden’s U-space designation rules take effect",
        "date": "2026-06-01",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "UTM/U-space comms",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "Sweden",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.transportstyrelsen.se/TSFS/TSFS%202026_49.pdf",
        "status": "signal",
        "Details": "Transportstyrelsen’s TSFS 2026:49, decided 20 April 2026 and printed 30 April, entered into force on 1 June 2026. It sets how geographic UAS zones and U-space airspace are designed and applied for, supplementing Commission Implementing Regulations (EU) 2019/947 and 2021/664. Applicants for U-space must file the airspace risk assessment required by Article 3.1 of 2021/664; general advice points to Eurocontrol’s U-space Airspace Risk Assessment method. Decommissioning needs 90 days’ notice.",
        "Implication": "A member state turned the 2021 U-space regulation into an operable national procedure, which is what actually opens USSP markets.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "SWE",
        "truth_coordinates": [
          18.64,
          60.13
        ],
        "display_coordinates": [
          18.64,
          60.13
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S28",
      "geometry": null,
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S28",
        "title": "Rel-19 UAS Phase 3 work items circulate as 5G-Advanced baseline",
        "date": "2026-06-11",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "Drone NTN/D2D",
        "domain": "Technological",
        "location_type": "Regulator",
        "location": "International; 3GPP",
        "confidence": "Medium",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://blog.3g4g.co.uk/2026/06/release-19-takes-satellite-ntn-and.html",
        "status": "signal",
        "Details": "3GPP Release 19 materials briefed through mid-2026 list UAS Phase 3 items: pre-flight planning, in-flight monitoring, C2 reliability, multi-USS coordination, network-assisted detect-and-avoid, no-transmit zones, altitude reporting, NEF/UDM enhancements and USS-changeover security. Rel-19 also covers NTN Phase 3 (regenerative payloads, RedCap over NTN) and air-to-ground carrier aggregation/MIMO. Stage-3 freeze was late 2025; RAN4 performance freeze was reported around March 2026. The June briefings are the in-window dissemination to operators.",
        "Implication": "Aerial UE and HAPS/HIBS features are no longer study-only; chipset and core roadmaps can cite a frozen Rel-19 UAS/NTN set.",
        "geom_kind": "none",
        "coord_source": "none",
        "iso3": "",
        "truth_coordinates": null,
        "display_coordinates": null,
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S18",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -80.19,
          25.76
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S18",
        "title": "Lockheed and Verizon detect UAVs on existing 5G",
        "date": "2026-07-01",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "UTM/U-space comms",
        "domain": "Technological",
        "location_type": "Market",
        "location": "United States; Miami, Florida",
        "confidence": "Medium",
        "stakeholder_relevance": "Adjacent",
        "horizon": "12 months",
        "source_url": "https://aviationweek.com/aerospace/advanced-air-mobility/lockheed-martin-verizon-unveil-drone-detection-using-cell-towers",
        "status": "signal",
        "Details": "Aviation Week reported on 12 August 2026 that Lockheed Martin’s NetSense identified, detected and tracked small UAVs in the Miami area in July using existing Verizon 5G sites, with no new radios in the field. Lockheed pitched fast, relatively cheap deployment because it rides current networks. Exact ranges and false-alarm rates were behind the paywall summary.",
        "Implication": "Two independent 2026 cellular-sensing demos raise the odds that UTM and C-UAS policy will treat MNO grids as dual-use sensors.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -80.19,
          25.76
        ],
        "display_coordinates": [
          -80.19,
          25.76
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S20",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -77.04,
          38.91
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S20",
        "title": "FAA sends Part 108 BVLOS draft to OIRA",
        "date": "2026-07-10",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "Spectrum/airspace rule",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "United States; Washington, DC",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://lowaltitudeeconomy.aero/en/aam-events/faa-part-108-oira-review",
        "status": "signal",
        "Details": "The FAA draft final rule on routine low-altitude BVLOS UAS and supporting third-party services including UTM (RIN 2120-AL82) arrived at OIRA on 10 July 2026. As of early September it remained under review; Part 108 is not in the CFR and BVLOS still needs a Part 107 waiver, Part 11 exemption or Section 927 waiver. NPRM was 7 August 2025; a narrow reopened comment window on right-of-way and electronic conspicuity closed 11 February 2026.",
        "Implication": "Until publication, scalable airborne-network operations in the US stay waiver-bound; OIRA receipt is the last pre-publication gate.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -77.04,
          38.91
        ],
        "display_coordinates": [
          -76.88404,
          38.77663
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S23",
      "geometry": {
        "type": "Point",
        "coordinates": [
          4.35,
          50.85
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S23",
        "title": "EASA consults member states on U-space Light",
        "date": "2026-07-15",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "UTM/U-space comms",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "European Union",
        "confidence": "Medium",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.unmannedairspace.info/uncategorized/easa-ec-u-space-light-proposal-hangs-in-the-balance/",
        "status": "signal",
        "Details": "On 15 July 2026 EASA held an online consultation with member states and operator associations on the Commission/EASA “U-space Light” proposal. Unmanned Airspace reported support mixed with objections: one-week review time, AMC/GM uncertainty, Level 1 limited to uncontrolled airspace, undefined “remain well clear,” and Level 1 appearing mandatory when more than one BVLOS operator shares a volume. Industry pushed for rapid Phase 1A/1B “Pre U-space” in both controlled and uncontrolled airspace. No adoption decision in-window.",
        "Implication": "Europe is trying to thin U-space so BVLOS C2 can scale without full USSP stacks everywhere—and states are not aligned.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "EU",
        "truth_coordinates": [
          4.35,
          50.85
        ],
        "display_coordinates": [
          4.35,
          51.10322
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S26",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -77.04,
          38.91
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S26",
        "title": "FCC restates foreign UAS comms gear on Covered List",
        "date": "2026-07-20",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "Spectrum/airspace rule",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "United States; Washington, DC",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.fcc.gov/covered-list-faqs-uas-and-uas-critical-components",
        "status": "signal",
        "Details": "FCC Covered List FAQs current as of 20 July 2026 confirm the list includes UAS and UAS critical components produced in a foreign country, plus communications and video-surveillance equipment named in FY25 NDAA §1709. Critical components expressly include data-transmission devices, communications systems and flight controllers. First Conditional Approvals arrived 17 March 2026. The determination treats C2 and payload links as covered equipment, not only cameras.",
        "Implication": "US airborne-network supply chains must use approved radios; that is a hard constraint on UAV-as-node deployments.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -77.04,
          38.91
        ],
        "display_coordinates": [
          -76.7897,
          39.06033
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S24",
      "geometry": {
        "type": "Point",
        "coordinates": [
          37.91,
          -0.02
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S24",
        "title": "Aalto states Spain Zephyr campaign and Kenya AALTOport push",
        "date": "2026-07-23",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "HAPS broadband",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "Spain; Kenya AALTOport",
        "confidence": "Medium",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://aerospaceglobalnews.com/video/aalto-zephyr-haps-commercial-operations/",
        "status": "signal",
        "Details": "At Farnborough on 23 July 2026 Aalto CEO Hughes Boulnois said the company was undertaking a Spain flight-test campaign to show complete Zephyr-system readiness, expanding the Kenya AALTOport, and continuing UK CAA type-certification work. Zephyr’s 2025 record remains 67 days 6 hours 52 minutes from Kenya through Australian FIRs and two ITCZ crossings. Design Organisation Approval dates to 2024; type cert is the commercial gate. No new endurance record landed in this window.",
        "Implication": "Persistent HTA HAPS ops are being industrialised (bases, cadence, cert) even without a 2026 headline flight-time record.",
        "geom_kind": "country-centroid",
        "coord_source": "locality-country",
        "iso3": "KEN",
        "truth_coordinates": [
          37.91,
          -0.02
        ],
        "display_coordinates": [
          37.91,
          -0.02
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S22",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -98.58,
          39.83
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S22",
        "title": "FAA issues nationwide drone-delivery environmental finding",
        "date": "2026-07-28",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "UTM/U-space comms",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "United States",
        "confidence": "Medium",
        "stakeholder_relevance": "Adjacent",
        "horizon": "Now",
        "source_url": "https://dronexl.co/2026/09/15/wing-walmart-tacoma-washington-drone-delivery-permit/",
        "status": "signal",
        "Details": "The FAA signed a national programmatic environmental finding on 28 July 2026 allowing drone-delivery operators to tier to one nationwide review instead of a metro-by-metro study. Subsequent reporting contrasted faster Wing pathing in Houston/Atlanta with Zipline’s older Seattle-specific assessment still pending. The finding does not itself authorise spectrum or C2, but it removes a gating document for dense low-altitude networks that need UTM and cellular C2.",
        "Implication": "Environmental clearance is now a national template, which is what lets multi-nest C2 networks multiply sites.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "USA",
        "truth_coordinates": [
          -98.58,
          39.83
        ],
        "display_coordinates": [
          -98.13751,
          39.45656
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S17",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -97.11,
          32.74
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S17",
        "title": "AT&T and Ericsson track drones with live 5G cells",
        "date": "2026-07-31",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "UTM/U-space comms",
        "domain": "Technological",
        "location_type": "Market",
        "location": "United States; Arlington, Texas",
        "confidence": "Medium",
        "stakeholder_relevance": "Adjacent",
        "horizon": "12 months",
        "source_url": "https://dronexl.co/2026/07/31/att-ericsson-5g-network-sensing-drone-detection/",
        "status": "signal",
        "Details": "AT&T and Ericsson used three commercial 5G sites near AT&T Stadium to detect and track drones at 300–400 ft during a World Cup-period demonstration, with no extra radar hardware. Two sites sat about 0.4 km from the zone. The passive multi-static system uses mid-band 5G reflections; claimed reach about 6 km with roughly 10 cm box resolution. The drone need not attach to the network or broadcast Remote ID.",
        "Implication": "If scaled, MNOs hold a low-altitude surveillance layer that regulators will treat as part of UTM conspicuity debates.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -97.11,
          32.74
        ],
        "display_coordinates": [
          -97.11,
          32.74
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S06",
      "geometry": {
        "type": "Point",
        "coordinates": [
          13.85,
          49.72
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S06",
        "title": "Telekom flies paired UAV cells over Czech race",
        "date": "2026-08-05",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "UAV backhaul",
        "domain": "Technological",
        "location_type": "Market",
        "location": "Czechia; Brdy Protected Landscape Area, Nepomuk",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.telecoms.com/5g-6g/dt-trials-duel-flying-base-stations",
        "status": "signal",
        "Details": "Deutsche Telekom, T-Mobile Czech Republic and Primoco UAV flew two Primoco One 150 aircraft as alternating flying base stations during the Běhej lesy trail race. UAVs at 2–3 km altitude covered up to 20 km² on standard terrestrial bands at up to 100 Mbit/s in a 10 MHz channel; phones camped automatically. Both aircraft used onboard satellite backhaul to the mobile core with no extra ground station. A portable cell covered start/finish; the pair kept about 1,900 runners connected while one aircraft refuelled. Aircraft already hold European certifications.",
        "Implication": "Two-ship relay plus sat backhaul turns a demo UAV cell into a 24/7 coverage product for events and disasters.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "CZE",
        "truth_coordinates": [
          13.85,
          49.72
        ],
        "display_coordinates": [
          13.85,
          49.72
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S07",
      "geometry": {
        "type": "Point",
        "coordinates": [
          45.08,
          23.89
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S07",
        "title": "Nokia and stc pilot drone-mounted 5G RAN",
        "date": "2026-08-12",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "UAV backhaul",
        "domain": "Technological",
        "location_type": "Market",
        "location": "Saudi Arabia",
        "confidence": "Medium",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.nokia.com/blog/nokia-and-stc-flexibly-boost-network-reach-with-flying-5g-base-station/",
        "status": "signal",
        "Details": "Nokia published that early trials with stc group mounted lightweight 5G RAN on a drone powered from the airframe. Backhaul was established wirelessly to the macro and core using flexible options listed as 4G, 5G, fibre and satellite. The write-up confirms integration under real-world conditions and positions stc among the first regional operators to pilot a flying 5G cell. Payload mass and throughput were not quantified in the public blog.",
        "Implication": "Airborne 5G moves from European race-day UAVs into a Gulf operator lab, widening the vendor set beyond one airframe.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "SAU",
        "truth_coordinates": [
          45.08,
          23.89
        ],
        "display_coordinates": [
          45.08,
          23.89
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S27",
      "geometry": {
        "type": "Point",
        "coordinates": [
          4.48,
          51.92
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S27",
        "title": "Port of Rotterdam files toward structured U-space airspace",
        "date": "2026-08-18",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "UTM/U-space comms",
        "domain": "Economic",
        "location_type": "Market",
        "location": "Netherlands; Port of Rotterdam",
        "confidence": "Medium",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.portofrotterdam.com/en/port-future/innovation/drones/u-space-airspace-port-rotterdam",
        "status": "signal",
        "Details": "The Port of Rotterdam Authority’s U-space page, updated in the window, states it is moving from Prototype U-space (Maasvlakte/Europoort web-app deconfliction since 2023) to pre-U-space: registration, admission and authorisation, to be legally embedded via Dutch airspace-change procedures. Design documents and risk analyses are in work. The port also published that it submitted an airspace-redesign application for the port area to enable large-scale drone use under European U-space rules.",
        "Implication": "A high-value industrial volume is demanding USSP-grade identification and authorisation, which is the commercial pull for U-space comms.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "NLD",
        "truth_coordinates": [
          4.48,
          51.92
        ],
        "display_coordinates": [
          4.48,
          51.92
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S01",
      "geometry": {
        "type": "Point",
        "coordinates": [
          134.15,
          33.29
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S01",
        "title": "SoftBank Sceye HAPS serves unmodified phones in Japan",
        "date": "2026-08-23",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "HAPS broadband",
        "domain": "Technological",
        "location_type": "Market",
        "location": "Japan; Muroto, Kochi Prefecture",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.softbank.jp/en/sbnews/entry/2026/09/02/120537",
        "status": "signal",
        "Details": "Sceye’s LTA HAPS ST1 reached Japanese airspace at 07:11 JST on 23 August 2026 after a 13-day, >15,000 km Pacific transit from New Mexico and loitered off Cape Muroto within a 5 km radius. SoftBank attached a 4G-equivalent payload to its core and ran two-way tests to unmodified smartphones: voice, SMS, apps, video calls/streaming, earthquake/tsunami alerts, and Japan Coast Guard 118 calls. Trade briefings later cited about 36 Mbps downlink. SoftBank called it Japan’s first HAPS-to-smartphone trial service.",
        "Implication": "Pre-commercial HAPS can now sit between towers and LEO as a disaster and rural layer on an operator core, not only as a lab payload.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "JPN",
        "truth_coordinates": [
          134.15,
          33.29
        ],
        "display_coordinates": [
          134.15,
          33.38044
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S02",
      "geometry": {
        "type": "Point",
        "coordinates": [
          134.15,
          33.29
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S02",
        "title": "HAPS remotely flies drones off Kochi coast",
        "date": "2026-08-23",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "UAV backhaul",
        "domain": "Technological",
        "location_type": "Market",
        "location": "Japan; Muroto, Kochi Prefecture",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.softbank.jp/corp/news/press/sbkk/2026/20260902_01/",
        "status": "signal",
        "Details": "In the same August 2026 Japan trial service, SoftBank and Sceye verified HAPS-to-drone communications: remote automated flight, stable transmission of flight-control commands, location, and video. SoftBank framed the result as a building block for a three-dimensional network linking satellites, HAPS, terrestrial cells and aerial mobility. The HAPS held station at about 16.5–17 km over the Muroto test box while the UAV link ran concurrently with smartphone tests.",
        "Implication": "Stratospheric nodes can carry both subscriber access and UAV C2, collapsing two airborne-network problems onto one platform.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "JPN",
        "truth_coordinates": [
          134.15,
          33.29
        ],
        "display_coordinates": [
          134.29518,
          33.15663
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S03",
      "geometry": {
        "type": "Point",
        "coordinates": [
          133.53,
          33.56
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S03",
        "title": "HAPS hosts mobile core and web server onboard",
        "date": "2026-08-23",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "HAPS broadband",
        "domain": "Technological",
        "location_type": "Lab/hospital",
        "location": "Japan; Kochi Prefecture airspace",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.softbank.jp/en/sbnews/entry/2026/09/02/120537",
        "status": "signal",
        "Details": "SoftBank and Sceye installed a mobile core and web server on ST1 and processed smartphone sessions entirely onboard, then returned results to handsets without routing through the terrestrial network. Average round-trip was 68 ms, more than 40% lower than equivalent internet/cloud processing, according to SoftBank. The firms called it the first published HAPS-hosted core-plus-server verification. The test ran during the late-August Japan loiter after the Pacific crossing.",
        "Implication": "Airborne edge changes the HAPS value proposition from relay-only to a survivable compute node for disaster and private-network use.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "JPN",
        "truth_coordinates": [
          133.53,
          33.56
        ],
        "display_coordinates": [
          133.53,
          33.65044
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S04",
      "geometry": {
        "type": "Point",
        "coordinates": [
          134.3,
          33.15
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S04",
        "title": "Ground laser continuously ranges stratospheric HAPS",
        "date": "2026-08-23",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "Launch/platform-tech",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "Japan; off Cape Muroto, Kochi",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "2–5 years",
        "source_url": "https://www.softbank.jp/corp/news/press/sbkk/2026/20260917_01/",
        "status": "signal",
        "Details": "On 23–24 August 2026 SoftBank, Hitotsubashi University and Japan’s National Institute of Polar Research continuously tracked Sceye’s loitering HAPS from the ground with a portable laser ranger derived from Hitotsubashi’s Omni-SLR and received returns from a corner-cube reflector on the airship. Announced 17 September as a world-first continuous ground laser-ranging of a stratospheric HAPS (their survey through 8 September). The test is a precursor to optical wireless links among ground, HAPS and LEO.",
        "Implication": "Link-budget work for optical HAPS feeders now has a real tracking result, not only satellite SLR heritage.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "JPN",
        "truth_coordinates": [
          134.3,
          33.15
        ],
        "display_coordinates": [
          134.3,
          33.24044
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S30",
      "geometry": {
        "type": "Point",
        "coordinates": [
          134.3,
          33.15
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S30",
        "title": "Japan Coast Guard 118 calls completed via HAPS cell",
        "date": "2026-08-23",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "HAPS broadband",
        "domain": "Social",
        "location_type": "Market",
        "location": "Japan; off Cape Muroto, Kochi",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.softbank.jp/en/sbnews/entry/2026/09/02/120537",
        "status": "signal",
        "Details": "During the August 2026 Kochi trial SoftBank and Sceye, cooperating with the Japan Coast Guard, verified voice calls to the 118 maritime emergency number from smartphones served by the stratospheric payload, plus earthquake early-warning and tsunami alert messaging. SoftBank said communications quality was comparable to terrestrial service while reducing interference with ground sites. This is a completed operational test with a statutory emergency service, not a consumer app demo.",
        "Implication": "Emergency-number success is the political proof point Japanese commercialisation in 2027 will cite.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "JPN",
        "truth_coordinates": [
          134.3,
          33.15
        ],
        "display_coordinates": [
          134.44495,
          33.01663
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S12",
      "geometry": {
        "type": "Point",
        "coordinates": [
          11.42,
          51.86
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S12",
        "title": "DLR HAP-alpha makes first uncrewed flight",
        "date": "2026-09-02",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "Launch/platform-tech",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "Germany; Magdeburg-Cochstedt Airport",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "2–5 years",
        "source_url": "https://www.dlr.de/en/me/latest/news",
        "status": "signal",
        "Details": "On 2 September 2026 DLR’s 27-metre, 138 kg solar HAP-alpha flew about 70 minutes and reached 180 m AGL from the National Experimental Test Center for Unmanned Aircraft Systems at Cochstedt. First flight after an eight-year, 16-institute build. The aircraft is designed for ~20 km with a ~5 kg payload (MACS-HAP camera and HAPSAR radar) plus communications experiments; Cochstedt flights stay low for safety before later high-altitude work. Take-off used DLR’s trailer/skid method.",
        "Implication": "A European state lab now has hardware in the air, reducing sole dependence on Airbus/Aalto and Sceye for HTA/LTA evidence.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "DEU",
        "truth_coordinates": [
          11.42,
          51.86
        ],
        "display_coordinates": [
          11.42,
          51.86
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S21",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -77.04,
          38.91
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S21",
        "title": "TSA opens Part 108 security-programme roundtables",
        "date": "2026-09-04",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "UTM/U-space comms",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "United States; Washington, DC",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://dronelife.com/2026/09/08/part-108-bvlos-requirements-tsa-security/",
        "status": "signal",
        "Details": "TSA published a Federal Register notice on 4 September 2026 seeking industry participants for technical roundtables on security requirements tied to FAA’s proposed Part 108 BVLOS framework. Focus: organisational, physical, structural and technological measures used today by waiver/exemption operators. Participation requests due 19 October 2026. Roundtables are scheduled only after FAA and TSA final rules publish. TSA is aligning so Part 108 does not create a security gap under 49 CFR 1540/1544/1550.",
        "Implication": "C2 links and UTM service suppliers will face a security programme, not only an aviation safety case.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -77.04,
          38.91
        ],
        "display_coordinates": [
          -77.31764,
          38.92909
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S05",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -106.05,
          35.0
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S05",
        "title": "Sceye ST1 completes 30,000 km Pacific round trip",
        "date": "2026-09-05",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "Launch/platform-tech",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "United States; Moriarty, New Mexico",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.prnewswire.com/news-releases/sceye-and-softbank-corp-complete-stratospheric-connectivity-demonstration-in-japan-advancing-towards-haps-commercialization-302866920.html",
        "status": "signal",
        "Details": "After the Japan trial, ST1 recrossed the Pacific, re-entered CONUS on 4 September 2026 and reached airspace near Sceye headquarters in Moriarty on 5 September, then completed additional vehicle tests and a planned termination. Total distance was nearly 30,000 km. Over Japan the vehicle held a station-keeping radius as tight as 5 km at 16.5–17 km altitude for more than seven days. Sceye positions full-scale coverage as roughly 500 terrestrial towers per ship.",
        "Implication": "Multi-week, multi-FIR HAPS logistics are now demonstrated, which is a prerequisite for selling months-long Japanese coverage from 2027.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -106.05,
          35.0
        ],
        "display_coordinates": [
          -106.05,
          35.0
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S11",
      "geometry": {
        "type": "Point",
        "coordinates": [
          28.37,
          47.41
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S11",
        "title": "Moldova publishes U-space operating regulation",
        "date": "2026-09-08",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "UTM/U-space comms",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "Moldova",
        "confidence": "Medium",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.moldpres.md/eng/society/doc-moldova-aligns-its-drone-rules-with-european-standards",
        "status": "signal",
        "Details": "Moldova published in the Official Journal a government-approved regulation on drone operations in U-space airspace, announced 8 September 2026. The text transposes the Commission implementing regulation on U-space and sets conditions for drones sharing airspace with manned aircraft, plus duties on operators and U-space service providers: identification, operating-area checks, flight authorisation and traffic information coordinated with ATS. Ministry of Infrastructure framed it as enabling deliveries, inspections and precision agriculture.",
        "Implication": "U-space comms obligations are spreading beyond EU-27, which matters for cross-border USSP software and C2 identity.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "MDA",
        "truth_coordinates": [
          28.37,
          47.41
        ],
        "display_coordinates": [
          28.37,
          47.41
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S09",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -77.04,
          38.91
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S09",
        "title": "FCC waives aeronautical-mobile bans for drone cellular tests",
        "date": "2026-09-11",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "Spectrum/airspace rule",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "United States; Washington, DC",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.fcc.gov/document/fcc-waiver-supports-dot-program-test-drone-use-mobile-networks",
        "status": "signal",
        "Details": "FCC WTB and OET issued DA-26-972 on 11 September 2026, effective the same day through 1 October 2029, waiving aeronautical-mobile prohibitions in §§ 2.106, 22.925, 27.2, 27.4, 30.6, 90.423 and 96.39(h) for DOT’s Mobile Network Aviation Assessment Program. DOT may field up to 2,000 GA pilots with a measurement app and up to 200 UAS with modules across 600 MHz, 700 MHz, FirstNet Band 14, 800 MHz, AWS, PCS and CBRS. Purpose: quantify commercial networks for UAS C2, DAA, Remote ID, conspicuity and C-UAS. Not a general airborne-cellular authorisation.",
        "Implication": "The United States now has a legal measurement campaign that will feed future UAS C2 spectrum rules instead of waiver folklore.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -77.04,
          38.91
        ],
        "display_coordinates": [
          -77.04,
          39.00044
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S13",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -3.44,
          55.38
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S13",
        "title": "ARIA funds enduring atmospheric platforms including power beaming",
        "date": "2026-09-16",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "HAPS broadband",
        "domain": "Economic",
        "location_type": "Regulator",
        "location": "United Kingdom",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "2–5 years",
        "source_url": "https://www.theregister.com/networks/2026/09/16/uk-funds-flying-broadband-stations-with-power-beamed-from-below/5296545",
        "status": "signal",
        "Details": "The UK Advanced Research and Invention Agency publicly described a £70 million Enduring Atmospheric Platforms programme over about 3.5 years across 18 teams. Success metric cited: net 300 W continuous DC to a 20 kg payload at stratospheric altitude for at least a week while holding station over the UK, with an operating-cost target below £500/hour and a path under £100/hour. Technical areas cover enabling tech, integration and communications deployment. Related awards named PHASA-35 as a flight host.",
        "Implication": "A government buyer is paying for winter-capable HAPS over mid-latitudes, which solar-only platforms have not solved.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "GBR",
        "truth_coordinates": [
          -3.44,
          55.38
        ],
        "display_coordinates": [
          -3.44,
          55.63322
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S14",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -1.31,
          51.58
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S14",
        "title": "Space Solar wins HAWK 5.8 GHz beam-power award",
        "date": "2026-09-17",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "Launch/platform-tech",
        "domain": "Technological",
        "location_type": "Actor HQ",
        "location": "United Kingdom; Harwell",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "2–5 years",
        "source_url": "https://www.adsadvance.co.uk/power-beaming-drones-pha-35/",
        "status": "signal",
        "Details": "Space Solar received a £1.3 million ARIA contract for Project HAWK to develop a 5.8 GHz RF power-beaming system aimed at PHASA-35. Partners: Prismatic (airframe) and MuWave (ground transmitter). Plan is to lift rectenna tech from about TRL 3 toward TRL 7 over 36 months, with field campaigns later in 2026–2027 and an integrated flight later in the programme. Goal is year-round stratospheric flight through UK winter nights.",
        "Implication": "If the beam works, HAPS service maps stop being equatorial-summer products and can be sold at UK latitudes.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "GBR",
        "truth_coordinates": [
          -1.31,
          51.58
        ],
        "display_coordinates": [
          -1.31,
          51.58
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S15",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -3.44,
          55.38
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S15",
        "title": "Prismatic PHASA-35 selected as UK beam-power flight host",
        "date": "2026-09-17",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "Launch/platform-tech",
        "domain": "Technological",
        "location_type": "Actor HQ",
        "location": "United Kingdom",
        "confidence": "Medium",
        "stakeholder_relevance": "Medium",
        "horizon": "2–5 years",
        "source_url": "https://ukdefencejournal.org.uk/ground-based-beam-could-keep-british-solar-drone-flying/",
        "status": "signal",
        "Details": "BAE Systems subsidiary Prismatic’s PHASA-35 was named the flight-demonstration platform for ARIA-linked power-beaming work. Separate reporting put a related Prismatic/BAE figure at about £15.7 million / $21.2 million. PHASA-35: 35 m span, ~150 kg, designed above 66,000 ft with up to ~15 kg payload for comms, EO and surveillance. CEO Bob Davidson said the project tests whether the already-flown stratospheric airframe can fly through night and winter with a wing-mounted receiver.",
        "Implication": "The UK is concentrating persistence R&D on one flown HAPS type rather than starting a new airframe.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "GBR",
        "truth_coordinates": [
          -3.44,
          55.38
        ],
        "display_coordinates": [
          -2.84188,
          55.00656
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S29",
      "geometry": {
        "type": "Point",
        "coordinates": [
          133.53,
          33.56
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S29",
        "title": "SoftBank brief cites 36 Mbps HAPS downlink to phones",
        "date": "2026-09-17",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "HAPS broadband",
        "domain": "Technological",
        "location_type": "Market",
        "location": "Japan; Kochi Prefecture",
        "confidence": "Medium",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://news.yahoo.co.jp/articles/64dc851093652e2970fc3bf7136538d875f1212e",
        "status": "signal",
        "Details": "At a mid-September 2026 SoftBank briefing on the August Japan trial, Impress Watch reported downlink of about 36 Mbps on direct-to-smartphone HAPS links, alongside the already-announced voice, video and alert tests and 2027 commercial aim. The number was not in the 2 September English news post. SoftBank also restated plans to fly optical gear on a LEO satellite in 2026 and add HAPS optical terminals in 2027 for a sat–HAPS–ground path.",
        "Implication": "A tens-of-Mbps handset figure, even in a limited trial, is what capacity planners need to compare HAPS with LEO D2D.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "JPN",
        "truth_coordinates": [
          133.53,
          33.56
        ],
        "display_coordinates": [
          133.67564,
          33.42663
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S25",
      "geometry": {
        "type": "Point",
        "coordinates": [
          138.25,
          36.2
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S25",
        "title": "MIC Japan frequency plan records HAPS rules and aerial 5G studies",
        "date": "2026-09-18",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "Spectrum/airspace rule",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "Japan",
        "confidence": "Medium",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.soumu.go.jp/main_content/001092441.pdf",
        "status": "signal",
        "Details": "A MIC frequency-policy document circulating 18 September 2026 states that technical conditions for HAPS fixed and mobile links were institutionalised in April 2026 and that FY2026 work continues on efficient HAPS frequency use. It also records ongoing study of technical conditions to allow drone/aerial use of 3.7 GHz and 4.5 GHz without harmful interference. Service-link discussion remains 2 GHz IMT/HIBS (1920–1980 / 2110–2170 MHz) and feeder 38–39.5 GHz.",
        "Implication": "National HAPS spectrum is no longer a study item in Japan; the live constraint is airborne 5G in mid-band—the same limit that sent Tokyo researchers to Oulu.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "JPN",
        "truth_coordinates": [
          138.25,
          36.2
        ],
        "display_coordinates": [
          138.25,
          36.45322
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "haps-uav-connectivity:2026-09-21:S19",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -118.45,
          33.98
        ]
      },
      "properties": {
        "id": "haps-uav-connectivity:2026-09-21:S19",
        "title": "Doodle Labs ships 48 g MIMO mesh radio for FPV",
        "date": "2026-09-21",
        "module": "HAPS / drones / UAV connectivity",
        "module_slug": "haps-uav-connectivity",
        "subtheme": "Launch/platform-tech",
        "domain": "Technological",
        "location_type": "Actor HQ",
        "location": "United States; Marina del Rey, California",
        "confidence": "Medium",
        "stakeholder_relevance": "Medium",
        "horizon": "Now",
        "source_url": "https://dronelife.com/2026/09/21/doodle-labs-digital-communications-small-fpv-drones/",
        "status": "signal",
        "Details": "On 21 September 2026 Doodle Labs introduced Nano², a 48.3 g 2×2 MIMO radio in roughly the Nano footprint, with cross-band agility and self-healing mesh. Bands cited include 900 MHz, 2.4 GHz and 5.8 GHz, including a dual 900/2.4 radio. Positioned for high-fidelity video at long range for military and commercial small UAS. The firm said it was selected with a partner for the Pentagon Drone Dominance campaign as a mesh backbone.",
        "Implication": "Link-budget and mesh density for sub-250 g and FPV classes just moved; that is a payload-tech change, not a new airframe.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -118.45,
          33.98
        ],
        "display_coordinates": [
          -118.45,
          33.98
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S01",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -77.04,
          38.91
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S01",
        "title": "FCC assigns EchoStar mid-band to SpaceX for D2D",
        "date": "2026-05-12",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Spectrum/licence",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "United States; Washington, DC",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.fcc.gov/document/order-granting-spacex-echostar-applications",
        "status": "signal",
        "Details": "On 12 May 2026 FCC WTB and Space Bureau released DA-26-471 granting assignment of EchoStar AWS-4, H-Block and unpaired AWS-3 licences plus earth stations to SpaceX—about 65 MHz nationwide—for next-generation D2D. SpaceX may use the bands in terrestrial, space-based or hybrid architectures under performance conditions. A parallel AT&T purchase of about 50 MHz was approved the same day in a combined roughly $40 billion package.",
        "Implication": "Exclusive mid-band for SCS changes who can sell nationwide satellite-to-phone and on what interference terms.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -77.04,
          38.91
        ],
        "display_coordinates": [
          -77.10032,
          38.64284
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S26",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -98.58,
          39.83
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S26",
        "title": "AT&T, T-Mobile and Verizon agree D2D JV in principle",
        "date": "2026-05-14",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Ground/wholesale",
        "domain": "Economic",
        "location_type": "Actor HQ",
        "location": "United States",
        "confidence": "Medium",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.verizon.com/about/news/att-t-mobile-verizon-plan-launch-joint-venture-helps-end-dead-zones",
        "status": "signal",
        "Details": "In May 2026 AT&T, T-Mobile and Verizon announced an agreement in principle to form a direct-to-device joint venture that would pool spectrum and create a unified interconnection platform for satellite operators. On the 22 July earnings call T-Mobile CEO Srini Gopalan said talks were progressing toward a long-form agreement and that Starlink exclusivity still runs at least through 2026. Definitive documents were not signed in-window.",
        "Implication": "US D2D wholesale may stop being a single-MNO exclusive and become a shared SCS interface.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "USA",
        "truth_coordinates": [
          -98.58,
          39.83
        ],
        "display_coordinates": [
          -99.14889,
          40.52142
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S34",
      "geometry": {
        "type": "Point",
        "coordinates": [
          18.0,
          59.36
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S34",
        "title": "Telenor IoT and Sateliot link terrestrial NB-IoT to LEO",
        "date": "2026-05-28",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Satellite IoT",
        "domain": "Economic",
        "location_type": "Actor HQ",
        "location": "Sweden; Solna / Spain; Barcelona",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://iotbusinessnews.com/2026/05/28/telenor-iot-and-sateliot-link-nb-iot-to-leo-satellite-coverage/",
        "status": "signal",
        "Details": "On 28 May 2026 Telenor IoT and Sateliot said standard NB-IoT devices can move between terrestrial cellular networks and Sateliot’s LEO constellation without proprietary hardware or custom firmware, provided the module supports the relevant 3GPP Release 17 NTN features. Field tests in Spain showed Telenor IoT SIMs staying attached to the satellite network for extended periods. Commercial price and device list were not published.",
        "Implication": "Standards-based satellite IoT becomes an attachment on an existing SIM rather than a second radio stack.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "SWE",
        "truth_coordinates": [
          18.0,
          59.36
        ],
        "display_coordinates": [
          18.0,
          59.36
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S16",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -77.04,
          38.91
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S16",
        "title": "FCC accepts Amazon-Globalstar licence transfer docket",
        "date": "2026-06-04",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Spectrum/licence",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "United States; Washington, DC",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.fcc.gov/transaction/amazon-globalstar",
        "status": "signal",
        "Details": "On 4 June 2026 the FCC accepted for filing and started the clock on GN Docket 26-134: assignment/transfer to Amazon of Globalstar space-station, earth-station, domestic and international 214, and an experimental licence, including 1.6/2.4 GHz service links and 5/7 GHz feeders plus six US gateway sites. The deal underpins the later 5,105-sat D2D file. Clock was still running as of 22 September (day 110).",
        "Implication": "Until this docket closes, Amazon’s D2D spectrum story is an application, not an asset.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -77.04,
          38.91
        ],
        "display_coordinates": [
          -76.88839,
          39.23522
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S12",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -77.04,
          38.91
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S12",
        "title": "FCC waives Amazon Leo 50-percent launch milestone",
        "date": "2026-06-05",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "LEO broadband",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "United States; Washington, DC",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://docs.fcc.gov/public/attachments/DA-26-553A1.pdf",
        "status": "signal",
        "Details": "On 5 June 2026 the FCC Space Bureau (DA-26-553) granted Kuiper Systems/Amazon Leo a limited waiver of the 50% Gen1 deployment milestone (1,616 of 3,232 by 30 July 2026) while keeping the 30 July 2029 full-deployment date. Satellites launched after the missed interim date temporarily lose spectral priority unless Amazon accelerates build rate. Amazon had about 180 on orbit at the January request and projected ~700 by the original deadline.",
        "Implication": "The US second LEO broadband competitor stays licensed; the penalty is queue position, not a kill.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -77.04,
          38.91
        ],
        "display_coordinates": [
          -76.65543,
          38.82901
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S22",
      "geometry": {
        "type": "Point",
        "coordinates": [
          120.96,
          23.7
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S22",
        "title": "Lynk tells FCC it is testing D2D in Taiwan",
        "date": "2026-06-05",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "D2D / direct-to-smartphone",
        "domain": "Technological",
        "location_type": "Market",
        "location": "Taiwan",
        "confidence": "Medium",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.advanced-television.com/2026/06/05/lynk-files-for-taiwan-licence/",
        "status": "signal",
        "Details": "On or about 5 June 2026 Lynk informed the FCC it had started testing in Taiwan with Taiwan Mobile and that it held the authorisations and agreements needed for direct-to-device supplementary coverage from space. Taiwan Mobile had separately been reported working with AST in March. The filing is a notice of testing, not a retail launch.",
        "Implication": "D2C competition in Taiwan is now two architectures on paper and at least one in test.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "TWN",
        "truth_coordinates": [
          120.96,
          23.7
        ],
        "display_coordinates": [
          120.96,
          23.7
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S08",
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.3,
          40.96
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S08",
        "title": "Zhuque-2E orbits China Mobile-02 and Yuanxin D2D sats",
        "date": "2026-06-09",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "D2D / direct-to-smartphone",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "China; Jiuquan",
        "confidence": "Medium",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.moomoo.com/news/post/72141010/exclusive-china-mobile-s-third-satellite-may-be-launched-at",
        "status": "signal",
        "Details": "On 9 June 2026 LandSpace’s Zhuque-2E Y6 from Jiuquan placed Yuanxin/Spacesail’s first smartphone-direct test satellite and China Mobile-02 into planned orbits. Subsequent Chinese trade reporting said China Mobile-02 completed uplink/downlink tests and that a follow-on 03 satellite is planned with an onboard regenerative gNB plus IoT payload. Tiantong GEO voice had already been offered nationally in April.",
        "Implication": "China’s D2C path is now LEO test-sats on commercial methane rockets, not only GEO MSS.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "CHN",
        "truth_coordinates": [
          100.3,
          40.96
        ],
        "display_coordinates": [
          100.3,
          41.05044
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S19",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.21,
          46.23
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S19",
        "title": "France signs Centaure OneWeb bridge-to-IRIS² contract",
        "date": "2026-06-15",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Ground/wholesale",
        "domain": "Political",
        "location_type": "Market",
        "location": "France",
        "confidence": "Medium",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://aviationweek.com/space/satellites/france-eutelsat-sign-multiyear-contract-bridge-iris2",
        "status": "signal",
        "Details": "On 15 June 2026 at Eurosatory the French government signed the multi-year Centaure contract with Eutelsat for OneWeb services to bridge to IRIS² secure satcom and add capacity. Aviation Week described an eight-year vehicle with a published maximum value behind paywall. The act is a closed government procurement, not a roadmap.",
        "Implication": "Sovereign European LEO demand is already a contract on OneWeb, years before IRIS² operations.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "FRA",
        "truth_coordinates": [
          2.21,
          46.23
        ],
        "display_coordinates": [
          2.70122,
          45.85656
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S29",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -51.93,
          -14.24
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S29",
        "title": "Sateliot and CPQD demonstrate NB-IoT NTN on Brazilian cattle",
        "date": "2026-06-15",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Satellite IoT",
        "domain": "Technological",
        "location_type": "Market",
        "location": "Brazil",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://sateliot.space/news/",
        "status": "signal",
        "Details": "On 15 June 2026 Sateliot and Campinas research centre CPQD said they had validated a hybrid satellite–cellular NB-IoT model in Brazil, starting with bovine traceability in an area without terrestrial coverage. Devices used standard cellular IoT modules rather than proprietary satellite terminals. Sateliot later pointed to a September–October commercial start; that start is not this row.",
        "Implication": "Brazil’s IoT gap in agro is being tested as a 3GPP NTN roam, not only as Starlink dishes.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "BRA",
        "truth_coordinates": [
          -51.93,
          -14.24
        ],
        "display_coordinates": [
          -52.55409,
          -14.18655
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S05",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -80.58,
          28.47
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S05",
        "title": "Falcon 9 deploys AST BlueBirds 8–10",
        "date": "2026-06-17",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "D2D / direct-to-smartphone",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "United States; Cape Canaveral, Florida",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.businesswire.com/news/home/20260617420856/en/",
        "status": "signal",
        "Details": "On 17 June 2026 a Falcon 9 from SLC-40 lofted AST BlueBirds 8, 9 and 10; SpaceX confirmed deployment. AST said each Block 2 array is about 2,400 sq ft (223 m²) and is designed for peak rates near 200 Mbps to unmodified phones. The stacked launch followed the April loss of BlueBird 7 on a New Glenn upper-stage failure.",
        "Implication": "D2C capacity is now a launch-cadence problem on Falcon 9, not a single-prototype story.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -80.58,
          28.47
        ],
        "display_coordinates": [
          -80.58,
          28.56044
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S23",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -98.58,
          39.83
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S23",
        "title": "Mlink chipset begins Iridium NTN Direct over-the-air tests",
        "date": "2026-06-26",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Satellite IoT",
        "domain": "Technological",
        "location_type": "Lab/hospital",
        "location": "United States / global Iridium mesh",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://iotbusinessnews.com/2026/06/26/iridium-ntn-direct-moves-into-on-air-testing-with-mlink-iot-ntn-chipset/",
        "status": "signal",
        "Details": "On 26 June 2026 Iridium and Mlink said the MS150-IR IoT-NTN chipset finished Iridium lab tests and entered live on-air testing on Iridium NTN Direct, Iridium’s 3GPP NTN service. Certification and product availability were targeted before end-2026. This is silicon validation, not a consumer launch.",
        "Implication": "Standards-based NB-IoT over Iridium becomes an OEM module choice, not a proprietary modem-only club.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "USA",
        "truth_coordinates": [
          -98.58,
          39.83
        ],
        "display_coordinates": [
          -97.86986,
          40.25093
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S13",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -80.58,
          28.47
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S13",
        "title": "ULA deploys 29 Amazon Leo satellites",
        "date": "2026-07-02",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "LEO broadband",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "United States; Cape Canaveral, Florida",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.newsquawk.com/headlines/amazon-amzn-has-launched-29-project-kuiper-satellites-into-planned-low-earth-orbit-on-2nd-july",
        "status": "signal",
        "Details": "On 2 July 2026 Amazon lofted 29 Project Kuiper/Amazon Leo satellites to planned LEO on a ULA rocket from Cape Canaveral; ULA confirmed planned deployment. Public trackers later put production spacecraft launched at 396 across 14 missions through that date, still short of the 578 often cited for initial coverage and far short of the waived 1,616 interim mark. No consumer service start was announced with the flight.",
        "Implication": "Amazon can add tens of sats per ride, but the FCC waiver exists because cadence still misses the original 50% date.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -80.58,
          28.47
        ],
        "display_coordinates": [
          -80.82576,
          28.48909
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S33",
      "geometry": {
        "type": "Point",
        "coordinates": [
          110.95,
          19.61
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S33",
        "title": "Qianfan Polar Group 14 puts 20 sats on Long March 8A",
        "date": "2026-07-05",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "LEO broadband",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "China; Wenchang",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://en.wikipedia.org/wiki/Qianfan",
        "status": "signal",
        "Details": "On 5 July 2026 at 01:43 UTC Long March 8A from Wenchang LC-1 launched Qianfan G60 Polar Group 14 (20 satellites). KeepTrack later listed QIANFAN-234 to -238 among that mission’s catalogued objects. Phase-1 target remains 1,296; commercial service still unstarted in September trackers.",
        "Implication": "State lift is still doing the heavy Qianfan raising while private rockets take demonstration slots.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "CHN",
        "truth_coordinates": [
          110.95,
          19.61
        ],
        "display_coordinates": [
          110.72066,
          19.62909
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S28",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -51.93,
          -14.24
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S28",
        "title": "Anatel extends Starlink S-band D2D consultation",
        "date": "2026-07-21",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Spectrum/licence",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "Brazil",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://telesintese.com.br/anatel-prorroga-consulta-sobre-d2d-da-starlink/",
        "status": "signal",
        "Details": "Despacho Decisório nº 10/2026/ORER/SOR published 21 July 2026 extended Consulta Pública 29/2026 on Starlink’s request for 10+10 MHz in lower S-band on its NGSO system to 31 July after Claro, Unifique and Omnispace asked for time. Starlink’s existing Brazilian exploration right covers up to 11,908 satellites in Ku, Ka and E. The S-band add was filed in March. No grant in-window.",
        "Implication": "S-band in Brazil is now a contested D2D input, not an uncontested Starlink extra.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "BRA",
        "truth_coordinates": [
          -51.93,
          -14.24
        ],
        "display_coordinates": [
          -51.57942,
          -14.61344
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S07",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -3.44,
          55.38
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S07",
        "title": "Ofcom issues Vodafone AST D2D trial licence",
        "date": "2026-07-24",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Spectrum/licence",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "United Kingdom",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.telecomstechnews.com/news/ast-spacemobile-uk-direct-to-cell-plans-use-vodafone-spectrum/",
        "status": "signal",
        "Details": "Ofcom issued Demonstration & Trial Licence 1418602/1 to Vodafone on 24 July 2026, running to 30 September 2026, to demonstrate satellite direct-to-mobile. Schedule lists 894.6 and 939.6 MHz at 5 MHz, UK-wide, max ERP 0.32 dBW. AST’s 11 August FCC filing attached the licence and mapped tests in 892.1–897.1 / 937.1–942.1 MHz with Goonhilly among gateways. The trial paper itself says it is not renewable beyond 12 months.",
        "Implication": "Vodafone–AST UK D2C is no longer only a JV slide; it has an Ofcom frequency and an end date.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "GBR",
        "truth_coordinates": [
          -3.44,
          55.38
        ],
        "display_coordinates": [
          -4.50475,
          55.43345
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S15",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -77.04,
          38.91
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S15",
        "title": "Amazon files 5,105-sat D2D system on Globalstar bands",
        "date": "2026-07-24",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "D2D / direct-to-smartphone",
        "domain": "Technological",
        "location_type": "Regulator",
        "location": "United States; Washington, DC",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "2–5 years",
        "source_url": "https://www.satellitetoday.com/connectivity/2026/07/27/amazon-leo-files-for-5105-satellites-in-globalstar-spectrum-for-d2d/",
        "status": "signal",
        "Details": "On 24–25 July 2026 Kuiper Systems filed at the FCC for an Amazon Leo D2D constellation of up to 5,105 satellites using Globalstar 1.6/2.4 GHz MSS (and additional L/S-band outside the US), with Ka/V feeders, optical ISLs, beamforming/beam-hopping, and five shells at 510–580 km. The architecture assumes Amazon’s pending ~$11.6 billion Globalstar acquisition. It is intended to sit beside Leo Gen1/Gen2 broadband and Globalstar HIBLEO and C-3.",
        "Implication": "Amazon is no longer only a dish-broadband rival; it has a standards-band D2D paper on file.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -77.04,
          38.91
        ],
        "display_coordinates": [
          -77.41351,
          38.75803
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S30",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -97.16,
          25.99
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S30",
        "title": "Starship Flight 13 deploys 20 Starlink V3 satellites",
        "date": "2026-07-24",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Launch/sat-tech",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "United States; Starbase, Texas",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.spacex.com/launches/starship-flight-13",
        "status": "signal",
        "Details": "On 24 July 2026 at 17:51 CDT Starship Flight 13 lifted off from Starbase. After a full-duration ascent, Ship 40 deployed all 20 Starlink V3 satellites; SpaceX made RF and laser contact with every spacecraft and downloaded telemetry. The flight was suborbital by design, so the satellites reentered about 20 minutes later. V3 is described at about 1 Tbps downlink each and is too large for Falcon 9.",
        "Implication": "Gigabit-class consumer and D2D capacity is now gated on Starship working as a satellite truck, not on V2 Mini cadence.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -97.16,
          25.99
        ],
        "display_coordinates": [
          -97.16,
          26.08044
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S04",
      "geometry": {
        "type": "Point",
        "coordinates": [
          138.25,
          36.2
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S04",
        "title": "AST starts commercial D2C in Japan with Rakuten",
        "date": "2026-08-04",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "D2D / direct-to-smartphone",
        "domain": "Technological",
        "location_type": "Market",
        "location": "Japan",
        "confidence": "Medium",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.ventureatlas.org/company/ast-spacemobile",
        "status": "signal",
        "Details": "AST SpaceMobile notified the FCC that on 4 August 2026 it began active direct-to-cell operations in Japan with Rakuten Mobile on Rakuten 700 MHz spectrum—described as AST’s first commercial D2C service outside the United States. Continuous US commercial service was separately deferred on 15 July from late 2026 to early 2027 after launch-vehicle disruptions.",
        "Implication": "A paying non-US D2C market is live while the US SCS licence still awaits continuous coverage.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "JPN",
        "truth_coordinates": [
          138.25,
          36.2
        ],
        "display_coordinates": [
          138.6711,
          35.82656
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S31",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -75.7,
          45.42
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S31",
        "title": "Telesat wins C$2.3B Arctic Mil-Ka Lightspeed contract",
        "date": "2026-08-04",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "LEO broadband",
        "domain": "Economic",
        "location_type": "Actor HQ",
        "location": "Canada; Ottawa",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "2–5 years",
        "source_url": "https://www.telesat.com/press/press-releases/telesat-secures-2-3-billion-arctic-military-satcom-contract-expanding-telesat-lightspeed-network-and-capacity-by-44/",
        "status": "signal",
        "Details": "On 4 August 2026 Telesat LEO ULC signed a C$2.3 billion, 15-year Lightspeed services contract with Canada’s Defence Investment Agency for Mil-Ka Arctic connectivity to the Canadian Armed Forces under ESCP-P, plus two five-year options of about C$200 million each. The deal funds 69 extra satellites, taking the initial constellation from 156 to 225, all built by MDA Space in Montreal, with Falcon 9 launches already partly secured. Service under the contract begins in 2028.",
        "Implication": "A sovereign defence buyer just paid to make an enterprise LEO network larger than its commercial plan.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "CAN",
        "truth_coordinates": [
          -75.7,
          45.42
        ],
        "display_coordinates": [
          -75.7,
          45.42
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S32",
      "geometry": {
        "type": "Point",
        "coordinates": [
          110.95,
          19.61
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S32",
        "title": "Guowang Group 23 rides Long March 8A from Wenchang",
        "date": "2026-08-04",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "LEO broadband",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "China; Wenchang",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.rocketlaunch.live/launch/guowang-23",
        "status": "signal",
        "Details": "On 4 August 2026 at 08:52 UTC a Long March 8A from Wenchang LC-1 launched SatNet LEO Group 23 (Hulianwang 178–186 class nine-packs in wiki tables). The flight sits between June Group 22 and mid-August Group 24. Combined with the September Group 25 flight it shows two state vehicle families (8A and 12) sharing Guowang deployment.",
        "Implication": "Chinese state LEO broadband is a multi-vehicle production line, not a single-rocket experiment.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "CHN",
        "truth_coordinates": [
          110.95,
          19.61
        ],
        "display_coordinates": [
          111.07883,
          19.47663
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S06",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -80.58,
          28.47
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S06",
        "title": "Falcon 9 deploys AST BlueBirds 11–13",
        "date": "2026-08-05",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Launch/sat-tech",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "United States; Cape Canaveral, Florida",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://spaceflightnow.com/2026/08/05/live-coverage-spacex-to-launch-3-ast-spacemobile-bluebird-satellites-on-falcon-9-rocket-from-cape-canaveral/",
        "status": "signal",
        "Details": "On 5 August 2026 a Falcon 9 from SLC-40 deployed BlueBirds 11, 12 and 13 at 03:49 EDT; SpaceX confirmed deployment. Combined with the June trio this put 13 AST vehicles in orbit after the BlueBird 7 loss. CEO Abel Avellan said production was in flow through satellite 42.",
        "Implication": "Repeated F9 rides show AST’s near-term orbit access is now SpaceX-shaped, not New Glenn-shaped.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -80.58,
          28.47
        ],
        "display_coordinates": [
          -80.44194,
          28.33663
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S21",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -98.58,
          39.83
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S21",
        "title": "Lynk and Omnispace close merger as Elveo Mobile",
        "date": "2026-08-17",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "D2D / direct-to-smartphone",
        "domain": "Economic",
        "location_type": "Actor HQ",
        "location": "United States",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.datacenterdynamics.com/en/news/lynk-global-and-omnispace-complete-merger-create-elveo-mobile/",
        "status": "signal",
        "Details": "On 17 August 2026 Lynk Global and Omnispace closed their merger and launched Elveo Mobile for D2D to phones, devices and machines. Elveo inherits Omnispace’s 60 MHz globally coordinated S-band and ITU filings plus Lynk’s five LEO smallsats and MNO deals. SES remains a major shareholder. Commercial multi-band 5G-NTN service is the stated product, not yet a new national licence in this notice.",
        "Implication": "S-band market access plus a live D2C bus is now one balance sheet, which is how smaller D2D players survive Starlink/AST scale.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "USA",
        "truth_coordinates": [
          -98.58,
          39.83
        ],
        "display_coordinates": [
          -99.3677,
          39.88345
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S25",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -98.58,
          39.83
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S25",
        "title": "T-Mobile discloses T-Satellite at 0.002 percent of traffic",
        "date": "2026-08-24",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "D2D / direct-to-smartphone",
        "domain": "Economic",
        "location_type": "Market",
        "location": "United States",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "Now",
        "source_url": "https://www.techtimes.com/articles/325440/20260825/t-mobile-live-data-shows-satellite-0002-traffic-physics-explains-cap.htm",
        "status": "signal",
        "Details": "At the Evercore TMT conference on 24 August 2026 T-Mobile CFO Peter Osvaldik said D2D satellite traffic was 0.002% of T-Mobile network traffic in the preceding week, up tenfold from CEO Gopalan’s May figure of 0.0002%. T-Satellite launched commercially in July 2025, later added data/voice-capable apps, and is sold as a $10 add-on across CONUS, PR, Hawaii and parts of southern Alaska on 650+ direct-to-cell satellites.",
        "Implication": "Measured share shows D2D is a coverage product, not a terrestrial-traffic substitute—yet.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "USA",
        "truth_coordinates": [
          -98.58,
          39.83
        ],
        "display_coordinates": [
          -98.75115,
          39.08194
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S27",
      "geometry": {
        "type": "Point",
        "coordinates": [
          53.85,
          23.42
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S27",
        "title": "UAE TDRA grants Starlink a 10-year space-services licence",
        "date": "2026-08-28",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "LEO broadband",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "United Arab Emirates",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.zawya.com/en/press-release/government-news/tdra-grants-starlink-a-license-to-provide-satellite-internet-services-in-the-uae-470465",
        "status": "signal",
        "Details": "On 28 August 2026 the Telecommunications and Digital Government Regulatory Authority granted Starlink Satellite Communications LLC a 10-year General Space Services Licence to establish, operate and manage a public satellite communications network and sell broadband to consumers, businesses and government, plus maritime and aviation, in the UAE. A 2024 TDRA paper had been limited to maritime. Consumer service was reported live on 3 September.",
        "Implication": "A Gulf regulator just put LEO broadband on the same public-network footing as fibre and 5G.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "ARE",
        "truth_coordinates": [
          53.85,
          23.42
        ],
        "display_coordinates": [
          53.85,
          23.42
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S37",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -51.93,
          -14.24
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S37",
        "title": "Sateliot and Grupo Constanta target Brazilian utility IoT",
        "date": "2026-09-01",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Satellite IoT",
        "domain": "Economic",
        "location_type": "Market",
        "location": "Brazil",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://sateliot.space/news/",
        "status": "signal",
        "Details": "On 1 September 2026 Sateliot and Grupo Constanta Industrial Ltda announced an alliance to connect Brazilian utilities and energy infrastructure with 5G NTN from Sateliot’s LEO constellation—smart grids, public lighting, sanitation and agriculture. Sateliot called it the country’s first LEO satellite IoT deployment in those sectors. The June CPQD livestock demo remains the technical predecessor.",
        "Implication": "Brazilian industrial IoT is being sold as hybrid cellular–LEO rather than as a dish per site.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "BRA",
        "truth_coordinates": [
          -51.93,
          -14.24
        ],
        "display_coordinates": [
          -51.36736,
          -13.81907
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S38",
      "geometry": {
        "type": "Point",
        "coordinates": [
          19.5,
          47.16
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S38",
        "title": "4iG signs Europe’s first Starlink Mobile plus sovereign deal",
        "date": "2026-09-02",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "D2D / direct-to-smartphone",
        "domain": "Economic",
        "location_type": "Market",
        "location": "Hungary",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://teslanorth.com/2026/09/02/starlink-mobile-hungary-albania/",
        "status": "signal",
        "Details": "On 2 September 2026 4iG Group and SpaceX signed agreements in Texas for first-generation Starlink Mobile in Hungary and Albania (apps and messaging to unmodified LTE phones) and a later V2 5G-NTN layer in Hungary, Albania, Montenegro and North Macedonia using SpaceX global 2 GHz priority rights, plus a separate Sovereign Solutions package for governments aimed at 2027. Start dates remain subject to national regulators.",
        "Implication": "Starlink Mobile enters the EU/Western Balkans as an MNO-group product, not only as T-Mobile US SCS.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "HUN",
        "truth_coordinates": [
          19.5,
          47.16
        ],
        "display_coordinates": [
          19.5,
          47.16
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S14",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.21,
          46.23
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S14",
        "title": "Amazon adds six Ariane 6 missions for Leo",
        "date": "2026-09-10",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "LEO broadband",
        "domain": "Economic",
        "location_type": "Actor HQ",
        "location": "France; European spaceport chain",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://en.wikipedia.org/wiki/Amazon_Leo",
        "status": "signal",
        "Details": "On 10 September 2026 Amazon said it booked six additional Arianespace launches, lifting Leo missions on Ariane 6 from 18 to 24. The add sits beside existing ULA, Blue Origin and extra Falcon 9/New Glenn purchases disclosed earlier in 2026 after the FCC milestone waiver. First 36-sat Ariane 64 Block 2 Leo flight was already logged 17 June from Guiana.",
        "Implication": "Launch diversity is now Amazon’s answer to the waived US milestone, and it is paying Europe for part of that diversity.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "FRA",
        "truth_coordinates": [
          2.21,
          46.23
        ],
        "display_coordinates": [
          2.21,
          46.48322
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S17",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.35,
          48.86
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S17",
        "title": "Eutelsat ATP for 229 more OneWeb satellites",
        "date": "2026-09-10",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "LEO broadband",
        "domain": "Economic",
        "location_type": "Actor HQ",
        "location": "France; Paris / Toulouse",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "2–5 years",
        "source_url": "https://www.eutelsat.com/media-press/media-centre/news/eutelsat-procures-a-further-oneweb-229-leo-satellites-airbus",
        "status": "signal",
        "Details": "On 10 September 2026 at the Paris International Space Summit Eutelsat signed an Authorisation to Proceed with Airbus Defence and Space for 229 additional OneWeb LEO satellites, about €1 billion, on top of 440 already ordered (total 669 new). First units from the 440 are due next quarter; replenishment runs through 2034. New buses add digital channelizers and hosted-payload capability. Eutelsat leads IRIS² LEO design/operations.",
        "Implication": "Europe is buying constellation continuity in cash, not waiting for IRIS² first light.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "FRA",
        "truth_coordinates": [
          2.35,
          48.86
        ],
        "display_coordinates": [
          2.35,
          48.86
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S18",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -52.77,
          5.24
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S18",
        "title": "Eutelsat books two dedicated Ariane 64 OneWeb flights",
        "date": "2026-09-10",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Launch/sat-tech",
        "domain": "Economic",
        "location_type": "Launch/test site",
        "location": "France; Guiana Space Centre",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "2–5 years",
        "source_url": "https://www.eutelsat.com/media-press/media-centre/news/eutelsat-selects-arianespace-two-upcoming-oneweb-leo-launches",
        "status": "signal",
        "Details": "The same 10 September 2026 Eutelsat package selected Arianespace for two dedicated Ariane 64 OneWeb missions in 2027 and 2028 from Europe’s Spaceport. Eutelsat framed them as replenishment capacity alongside other already-contracted providers. Missions are scheduled, not flown.",
        "Implication": "European LEO continuity now has named European lift, reducing sole dependence on non-EU rides.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "FRA",
        "truth_coordinates": [
          -52.77,
          5.24
        ],
        "display_coordinates": [
          -52.77,
          5.24
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S35",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.21,
          46.23
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S35",
        "title": "SpaceNews: Eutelsat awards IRIS² 330-LEO spacecraft work",
        "date": "2026-09-10",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "LEO broadband",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "European Union / France",
        "confidence": "Medium",
        "stakeholder_relevance": "High",
        "horizon": "2–5 years",
        "source_url": "https://spacenews.com/eutelsat-orders-extra-oneweb-satellites-and-kicks-off-iris%C2%B2-leo-contracts/",
        "status": "signal",
        "Details": "SpaceNews reported on 10 September 2026 that alongside the 229 OneWeb ATP, Eutelsat awarded contracts for the 330 LEO spacecraft in Europe’s IRIS² network, whose commercial Ku-band layer is slated mid-2032. Eutelsat is design/deployment/operations lead for that LEO segment. Treat the ATP/award day as the event; first flight is years out.",
        "Implication": "IRIS² LEO is now a procurement event, which is what module 12 counts—not the 2032 target.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "FRA",
        "truth_coordinates": [
          2.21,
          46.23
        ],
        "display_coordinates": [
          1.33555,
          46.28345
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S24",
      "geometry": {
        "type": "Point",
        "coordinates": [
          4.35,
          50.85
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S24",
        "title": "Iridium and DT IoT send NB-IoT voice from a Toyota",
        "date": "2026-09-11",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Satellite IoT",
        "domain": "Technological",
        "location_type": "Market",
        "location": "Europe / global Iridium",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.satellitetoday.com/connectivity/2026/09/11/iridium-sends-voice-message-from-toyota-vehicle-with-deutsche-telekom-iot/",
        "status": "signal",
        "Details": "On 11 September 2026 Iridium, Deutsche Telekom IoT and Toyota reported a standards-based NB-IoT voice message (“testing, testing, one, two, freeway”) from a Toyota vehicle using a Nordic nRF9151 board, a DT IoT SIM and Fraunhofer NESC codec, sent entirely on Iridium NTN Direct after a completed global roaming agreement. Selected European customers were already developing on DT’s Global SIM. Commercial NTN Direct availability was restated for Q4 2026.",
        "Implication": "Automotive and industrial IoT can treat LEO NTN as a roam partner, not a second SIM science project.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "EU",
        "truth_coordinates": [
          4.35,
          50.85
        ],
        "display_coordinates": [
          4.88822,
          50.47656
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S09",
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.3,
          40.96
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S09",
        "title": "LandSpace flies first commercial Qianfan batch",
        "date": "2026-09-15",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Launch/sat-tech",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "China; Jiuquan Site-96",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.china-in-space.com/p/qianfan-reaches-space-via-landspace",
        "status": "signal",
        "Details": "On 15 September 2026 at 14:26 CST LandSpace Zhuque-2E Y7 lofted 10 Qianfan (G60 Polar Group 19) connectivity satellites from Jiuquan—the first Qianfan group on a commercially developed launcher. Satellites were built by CAS Innovation Academy for Microsatellites. Qianfan/Spacesail is planned at about 15,000 spacecraft; Phase 1 1,296. Commercial service was still not reported as live as of mid-September.",
        "Implication": "Chinese LEO broadband cadence now includes private launch, which is the scarce input versus state Long March only.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "CHN",
        "truth_coordinates": [
          100.3,
          40.96
        ],
        "display_coordinates": [
          100.46071,
          40.82663
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S03",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -51.93,
          -14.24
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S03",
        "title": "Anatel extends Vivo-Starlink D2D sandbox to 2029",
        "date": "2026-09-16",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "D2D / direct-to-smartphone",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "Brazil",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://tecnoblog.net/noticias/anatel-prorroga-testes-da-starlink-com-a-vivo/",
        "status": "signal",
        "Details": "Anatel Ato nº 11.334, published in the Diário Oficial on 16 September 2026, extends Telefônica Brasil/Vivo’s experimental D2D authorization with Starlink from 22 October 2026 to 22 April 2029 nationwide. Tests use Vivo 2 567.5 and 2 687.5 MHz (5 MHz channels, ≤100 W) under SLP with SMP station licensing, with no cap on mobile stations. Commercial exploration is allowed inside sandbox rules; Vivo may add other satellite providers if it notifies Anatel.",
        "Implication": "Anatel is letting an MNO sell satellite-to-phone on its own mid-band before writing a permanent D2D rule.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "BRA",
        "truth_coordinates": [
          -51.93,
          -14.24
        ],
        "display_coordinates": [
          -51.93,
          -13.98678
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S10",
      "geometry": {
        "type": "Point",
        "coordinates": [
          122.5,
          31.2
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S10",
        "title": "Gravity-1 sea-launches Qianfan group off Shanghai",
        "date": "2026-09-16",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Launch/sat-tech",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "China; waters off Shanghai",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "http://www.china.org.cn/2026-09/16/content_118698233_4.shtml",
        "status": "signal",
        "Details": "On 16 September 2026 at 06:00 Beijing time Orienspace Gravity-1 Y3 lifted nine satellites—a Qianfan group plus an EUHT technology test satellite—from a barge off Shanghai under Taiyuan Satellite Launch Center management. Xinhua called the mission a complete success. It was the second Qianfan-related flight in the 15–17 September four-rocket burst.",
        "Implication": "Sea-based commercial lift is now part of Qianfan’s deployment mix, not a novelty demo.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "CHN",
        "truth_coordinates": [
          122.5,
          31.2
        ],
        "display_coordinates": [
          122.5,
          31.2
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S02",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -77.04,
          38.91
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S02",
        "title": "FCC grants SpaceX Section 214 for Starlink Mobile",
        "date": "2026-09-17",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Ground/wholesale",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "United States; Washington, DC",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://teslanorth.com/2026/09/18/fcc-spacex-starlink-mobile-section-214/",
        "status": "signal",
        "Details": "On 17 September 2026 the FCC granted Space Exploration Holdings global facilities-based and resale Section 214 authority (ITC-214-20260123-00021, authorization T260050, plus related amendments). SpaceX said the grant supports Starlink Mobile between the United States and foreign markets served by Starlink entities. It does not award foreign spectrum or landing rights.",
        "Implication": "Without 214, Starlink Mobile sessions that touch the US cannot be carried as a US international telecom service.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -77.04,
          38.91
        ],
        "display_coordinates": [
          -77.24051,
          39.15693
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S11",
      "geometry": {
        "type": "Point",
        "coordinates": [
          110.95,
          19.61
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S11",
        "title": "Long March 12 adds nine Guowang broadband sats",
        "date": "2026-09-17",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "LEO broadband",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "China; Wenchang",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.china-in-space.com/p/guowang-surpasses-200-satellites",
        "status": "signal",
        "Details": "On 17 September 2026 at 08:32 CST Long March 12 Y9 from Wenchang Commercial Pad 2 deployed nine Guowang/SatNet LEO Group 25 satellites built by CAS IAMCAS. Tracking write-ups put Guowang near 204 spacecraft after the flight, against a ~13,000-satellite plan (China SatNet). 2026 deployment goal cited at 310. No public retail broadband offer was attached to the batch.",
        "Implication": "Guowang is accumulating a real LEO broadband shell even without a consumer SKU announcement.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "CHN",
        "truth_coordinates": [
          110.95,
          19.61
        ],
        "display_coordinates": [
          110.95,
          19.70044
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S36",
      "geometry": {
        "type": "Point",
        "coordinates": [
          3.89,
          48.23
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S36",
        "title": "Orange commissions first European Lightspeed gateway",
        "date": "2026-09-17",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Ground/wholesale",
        "domain": "Economic",
        "location_type": "Factory",
        "location": "France; Bercenay-en-Othe",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.telesat.com/press/press-releases/orange-and-telesat-inaugurate-europes-first-telesat-lightspeed-gateway-in-france/",
        "status": "signal",
        "Details": "On 17 September 2026 Orange and Telesat LEO ULC commissioned the first European Telesat Lightspeed gateway inside Orange’s WTA Tier-4 teleport at Bercenay-en-Othe, with terrestrial connectivity to Telesat’s planned Paris point of presence. The site supports the planned 225-satellite constellation ahead of a Q1 2028 global in-service date. Orange and Telesat had signed a wholesale agreement in March 2025.",
        "Implication": "Enterprise LEO becomes usable in Europe only when a named gateway is lit, which this one now is.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "FRA",
        "truth_coordinates": [
          3.89,
          48.23
        ],
        "display_coordinates": [
          3.89,
          48.23
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S39",
      "geometry": {
        "type": "Point",
        "coordinates": [
          10.45,
          51.17
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S39",
        "title": "DT IoT adds Iridium LEO to multi-orbit roaming portfolio",
        "date": "2026-09-17",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Satellite IoT",
        "domain": "Economic",
        "location_type": "Actor HQ",
        "location": "Germany",
        "confidence": "Medium",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.telekom.com/en/newsroom/latest-updates/media-information",
        "status": "signal",
        "Details": "Deutsche Telekom’s 17 September 2026 media list includes multi-orbit IoT roaming with Iridium’s LEO network as part of DT IoT’s portfolio. Combined with the 11 September Toyota voice demo and completed roaming agreement, the operator-side productisation is the economic event: customers can buy NTN as a roam, with commercial NTN Direct still aimed at Q4.",
        "Implication": "LEO IoT distribution is moving through MNO IoT businesses, which is how modules reach fleets.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "DEU",
        "truth_coordinates": [
          10.45,
          51.17
        ],
        "display_coordinates": [
          10.45,
          51.42322
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S40",
      "geometry": {
        "type": "Point",
        "coordinates": [
          104.2,
          35.86
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S40",
        "title": "Four Chinese rockets fly Qianfan and SatNet in 45 hours",
        "date": "2026-09-17",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Launch/sat-tech",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "China",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://aerospaceglobalnews.com/news/china-four-rocket-launches-broadband-constellations/",
        "status": "signal",
        "Details": "Between 15 and 17 September 2026 China flew four orbital rockets (LandSpace Zhuque-2E, Orienspace Gravity-1, a Long March 12 and a Kuaizhou-11) from land and sea pads in under 45 hours. Two of the missions carried Qianfan and SatNet/Guowang broadband spacecraft. The burst is the in-window demonstration that Chinese LEO connectivity now has overlapping state and commercial lift.",
        "Implication": "Time-to-cover for PRC LEO broadband is becoming a launch-ops problem rather than a satellite-design problem.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "CHN",
        "truth_coordinates": [
          104.2,
          35.86
        ],
        "display_coordinates": [
          104.2,
          36.11322
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-28:S01",
      "geometry": {
        "type": "Point",
        "coordinates": [
          69.24,
          41.3
        ]
      },
      "properties": {
        "id": "leo:2026-09-28:S01",
        "title": "Amazon Leo names UZ-SAT Uzbekistan distributor",
        "date": "2026-09-22",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Ground/wholesale",
        "domain": "Economic",
        "location_type": "Market",
        "location": "Uzbekistan; Tashkent",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.aboutamazon.com/news/amazon-leo/amazon-leo-uzbekistan",
        "status": "signal",
        "Details": "On 2026-09-22 Amazon Leo and Uztelecom announced that UZ-SAT JV LLC, an Uztelecom subsidiary, is an authorized Amazon Leo distributor in Uzbekistan. The deal was presented at the 5th Tashkent International Investment Forum during ICT Week. UZ-SAT will package Leo capacity for sites where fibre is hard to build. Uztelecom cites 96% community reach, 378,000 km of fibre and more than 13 million users. Amazon states nearly 400 Leo satellites on orbit and a private preview only; Uzbekistan retail service is not yet sold.",
        "Implication": "First named Leo national-operator distributor in Central Asia. Wholesale path exists before a consumer SKU.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "UZB",
        "truth_coordinates": [
          69.24,
          41.3
        ],
        "display_coordinates": [
          69.24,
          41.3
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-28:S02",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -98.58,
          39.83
        ]
      },
      "properties": {
        "id": "leo:2026-09-28:S02",
        "title": "FCC grants SpaceX 60-day quad-band gateway STAs",
        "date": "2026-09-22",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Ground/wholesale",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "United States; Kansas, Texas, Arizona",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "Now",
        "source_url": "https://docs.fcc.gov/public/attachments/DOC-425290A1.pdf",
        "status": "signal",
        "Details": "On 2026-09-22 the FCC granted SpaceX Services 60-day special temporary authority (23 Sep–21 Nov 2026) to operate quad-band gateway earth stations with 40 technically identical 1.99 m antennas at Lawrence KS, Dallas TX, Eloy AZ and Phoenix AZ. The STAs cover communications with Starlink Gen1 (S2983/3018) and Gen2 (S2992/3069) in 27.5–30.0, 47.2–52.4, 81–86, 92–114.25 GHz uplinks and 17.3–20.2, 37.5–42.0 and 71–76 GHz downlinks.",
        "Implication": "Temporary feeder-link capacity added in four US markets while full licences process. Backhaul, not a new retail offer.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "USA",
        "truth_coordinates": [
          -98.58,
          39.83
        ],
        "display_coordinates": [
          -97.48892,
          39.60324
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-22:S20",
      "geometry": {
        "type": "Point",
        "coordinates": [
          19.15,
          51.92
        ]
      },
      "properties": {
        "id": "leo:2026-09-22:S20",
        "title": "OneWeb LEO trialled on PKP Intercity at 160 km/h",
        "date": "2026-09-22",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "LEO broadband",
        "domain": "Technological",
        "location_type": "Market",
        "location": "Poland; Kozłów–Warszawa–Tczew",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "Now",
        "source_url": "https://eutelsat-com.mynewsdesk.com/pressreleases/eutelsat-advances-connected-rail-with-successful-oneweb-leo-trial-in-poland-3468243",
        "status": "signal",
        "Details": "On 22 September 2026 Eutelsat said it completed its first Poland rail trial of OneWeb LEO on a PKP Intercity long-distance train at up to 160 km/h on Kozłów–Warszawa–Tczew, with ACO Solutions integrating and Hispasat distributing. The run collected performance data and satellite–terrestrial handover behaviour for passenger and operational comms.",
        "Implication": "LEO broadband is being packaged as mobility backhaul on live European rail, not only maritime/aviation.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "POL",
        "truth_coordinates": [
          19.15,
          51.92
        ],
        "display_coordinates": [
          19.15,
          51.92
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-28:S03",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -97.16,
          25.99
        ]
      },
      "properties": {
        "id": "leo:2026-09-28:S03",
        "title": "FAA licenses Starship Flight 14 launch and reentry",
        "date": "2026-09-26",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Launch/sat-tech",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "United States; Starbase, Texas",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "Now",
        "source_url": "https://aviationweek.com/space/launch-vehicles-propulsion/faa-clears-spacex-starship-14-flight",
        "status": "signal",
        "Details": "On 2026-09-26 the FAA issued license authorization for SpaceX Starship–Super Heavy Flight 14 launch and reentry operations. Aviation Week reported the FAA statement on 27 Sep. The licence covered the first attempted orbital Starship flight from Starbase OLP-2 carrying 26 Starlink Version 3 satellites (Group 31-1).",
        "Implication": "Regulatory gate for the first Starship-class Starlink deploy closed two days before liftoff.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -97.16,
          25.99
        ],
        "display_coordinates": [
          -97.02499,
          25.85663
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "leo:2026-09-28:S04",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -97.16,
          25.99
        ]
      },
      "properties": {
        "id": "leo:2026-09-28:S04",
        "title": "Starship deploys 26 operational Starlink V3 satellites",
        "date": "2026-09-28",
        "module": "LEO / satellite internet / space connectivity",
        "module_slug": "leo",
        "subtheme": "Launch/sat-tech",
        "domain": "Technological",
        "location_type": "Launch/test site",
        "location": "United States; Starbase, Texas",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.reuters.com/business/media-telecom/spacexs-starship-launches-14th-flight-first-headed-orbit-2026-09-28/",
        "status": "signal",
        "Details": "On 2026-09-28 at about 12:46 UTC Starship Flight 14 (Ship 41 / Super Heavy B21) lifted off from Starbase OLP-2, reached orbit for the first time and deployed all 26 Starlink V3 satellites of Group 31-1 at roughly 269 km. Elon Musk stated the 26 V3 satellites were operating nominally. An engine issue cut the planned ~10-hour mission to about three hours; Ship 41 made a controlled Pacific splashdown. V3 birds are designed for about 1 Tbps downlink each and require Starship-class fairing mass.",
        "Implication": "First operational Starlink payload on Starship. V3 capacity is no longer a suborbital demo only.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -97.16,
          25.99
        ],
        "display_coordinates": [
          -97.40035,
          26.00909
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S18",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -80.93,
          26.75
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S18",
        "title": "US Sugar runs five Deere autonomous tractors",
        "date": "2026-05-15",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Medical/ag/field",
        "domain": "Economic",
        "location_type": "Launch/test site",
        "location": "United States; Clewiston, Florida",
        "confidence": "Medium",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.globalbrandsmagazine.com/autonomous-tractors-no-driver/",
        "status": "signal",
        "Details": "In May 2026 US Sugar said it was running the largest commercial autonomous-tractor deployment in the American sugar industry: four John Deere 8R and one 9R on about 255,000 acres around Clewiston, Florida. 2026 autonomy kits remain concentrated on Midwest and Florida tillage rather than the full crop cycle. Separate 2026 coverage noted PTx Trimble OutRun tillage retrofits on Deere 8R/8000R and planned Fendt 900/1000 support later in the year.",
        "Implication": "Driverless tillage is a paid fleet on a named farm, not a concept video. Night shifts without a cab operator are now an estate-scale labour substitute.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -80.93,
          26.75
        ],
        "display_coordinates": [
          -80.93,
          26.75
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S22",
      "geometry": {
        "type": "Point",
        "coordinates": [
          121.57,
          25.03
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S22",
        "title": "NVIDIA ships Isaac GR00T reference humanoid",
        "date": "2026-05-31",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Autonomy stack",
        "domain": "Technological",
        "location_type": "Lab/hospital",
        "location": "Taiwan; Taipei",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://nvidianews.nvidia.com/news/nvidia-open-humanoid-robot-reference-design",
        "status": "signal",
        "Details": "On 31 May 2026 at GTC Taipei NVIDIA announced the Isaac GR00T Reference Humanoid: Unitree H2 Plus chassis (~6 ft, 150 lb, 31 DoF), Sharpa five-finger hands (22 DoF, 75 total), Jetson AGX Thor T5000 (2,070 FP4 TFLOPS, 128 GB) and open GR00T software. Hardware availability is late 2026. A GR00T workflow for Unitree G1 was slated for GitHub and Hugging Face. The design is aimed at academic and developer access rather than a factory SKU.",
        "Implication": "Reference hardware plus an open VLA collapses the lab bill of materials. Factory hours still depend on whoever fine-tunes the stack on a real cell.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "TWN",
        "truth_coordinates": [
          121.57,
          25.03
        ],
        "display_coordinates": [
          121.57,
          25.03
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S26",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -87.63,
          41.88
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S26",
        "title": "OMRON debuts LD-150 and LD-300 AMRs at Automate",
        "date": "2026-06-19",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Industrial / AMR",
        "domain": "Technological",
        "location_type": "Market",
        "location": "United States; Chicago",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.robotics247.com/article/automate-2026-omron-robotics-to-demonstrate-next-generation-amrs",
        "status": "signal",
        "Details": "In June 2026 OMRON Robotics said it would demonstrate LD-150 and LD-300 additions to the LD AMR series at Automate in Chicago, with shipments expected in Q4 2026. LD-150 carries 150 kg in a 500 mm-wide footprint; LD-300 carries 300 kg in 580 mm. Both run up to 2.1 m/s with wireless inductive charging in 30 minutes or less. The models target denser material flow rather than a new navigation stack.",
        "Implication": "Payload-per-aisle is the incremental AMR war. Q4 ship dates mean this is a 2026 product freeze, not yet a site-hour event.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -87.63,
          41.88
        ],
        "display_coordinates": [
          -87.467,
          41.74663
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S14",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -98.58,
          39.83
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S14",
        "title": "FDA clears LEM Dynamis spine humanoid robot",
        "date": "2026-06-23",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Medical/ag/field",
        "domain": "Technological",
        "location_type": "Regulator",
        "location": "United States",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.massdevice.com/lem-surgical-new-fda-clearance-surgical-robot/",
        "status": "signal",
        "Details": "On 23 June 2026 Bern-based LEM Surgical received a new FDA 510(k) for Dynamis, adding individual vertebra tracking with miniature bone-mounted markers, a robotic bi-manual stabilisation workflow and cervical indications. The upper-torso humanoid architecture sits on one compact cart that tucks under the table and accepts third-party instruments. First clearance was April 2025. CEO Yossi Bar said a second arm can now hold a segment while the other operates.",
        "Implication": "Hard-tissue robotics is leaving the single-arm-plus-camera template. Dual independent tracking changes how revision and deformity cases can be staged.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "USA",
        "truth_coordinates": [
          -98.58,
          39.83
        ],
        "display_coordinates": [
          -98.14985,
          40.74062
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S04",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -123.04,
          44.94
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S04",
        "title": "Agility files $2.5B SPAC with 65,000 Digit hours",
        "date": "2026-06-24",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Humanoid / general-purpose",
        "domain": "Economic",
        "location_type": "Actor HQ",
        "location": "United States; Salem, Oregon",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.therobotreport.com/humanoid-maker-agility-robotics-go-public-through-spac-merger/",
        "status": "signal",
        "Details": "On 24 June 2026 Agility Robotics announced a SPAC merger valuing the Digit maker at about $2.5 billion, to list as AGLT by year-end. Filings cite more than $300 million in multi-year Digit v5 orders tied to a 1,000-robot three-year contract and milestones. Digit is in use at Schaeffler, GXO, Toyota Motor Manufacturing Canada and Mercado Libre, with more than 65,000 hours across nine facilities. Amazon remains a pilot partner and investor, not confirmed as a current volume customer.",
        "Implication": "Commercial humanoid hours and a public listing now exist. The $300 million order book is milestone-contingent and should not be read as booked revenue.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -123.04,
          44.94
        ],
        "display_coordinates": [
          -123.04,
          45.03044
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S28",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -83.93,
          34.19
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S28",
        "title": "GXO Digit site logged 100,000 totes moved",
        "date": "2026-06-24",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Industrial / AMR",
        "domain": "Economic",
        "location_type": "Factory",
        "location": "United States; Flowery Branch, Georgia",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://wwd.com/sourcing-journal/logistics/agility-robotics-goes-public-humanoid-robots-digit-spac-merger-amazon-1239030943/",
        "status": "signal",
        "Details": "Agility’s 24 June 2026 listing materials restated that at GXO’s Flowery Branch, Georgia warehouse, which runs Spanx fulfilment, Digit moved more than 100,000 totes. That 2025 operating result was honoured in 2026 RBR50 coverage and is the quantitative proof behind Agility’s “commercial deployment” claim. Digit v4 carries 35 lb with a 16-hour charge window. The site is one of nine customer facilities in the 65,000-hour tally.",
        "Implication": "A six-figure tote count is the difference between a pilot and a billed cell. Other 3PLs now have a reference KPI to put in an RFP.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -83.93,
          34.19
        ],
        "display_coordinates": [
          -83.93,
          34.19
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S02",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -81.93,
          34.95
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S02",
        "title": "BMW puts Figure 03 on Spartanburg sequencing",
        "date": "2026-06-25",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Humanoid / general-purpose",
        "domain": "Technological",
        "location_type": "Factory",
        "location": "United States; Spartanburg, South Carolina",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.figure.ai/news/f-03-at-bmw",
        "status": "signal",
        "Details": "On 25 June 2026 BMW Group said Figure 03 would start logistics sequencing at Plant Spartanburg Hall 52 after Figure 02’s 2025 body-shop run that supported more than 30,000 X3s, moved over 90,000 components and logged about 1,250 hours. Figure 03 picks unsorted parts into sequencing trolleys for just-in-sequence delivery. New hardware includes tactile hands, palm cameras, wireless charging and speech-to-speech. Figure’s Helix 02 VLA coordinates whole-body loco-manipulation including pulling caster carts.",
        "Implication": "Humanoids at BMW have left the one-task pilot. Sequencing is a common auto-logistics job and a template other plants can copy.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -81.93,
          34.95
        ],
        "display_coordinates": [
          -81.93,
          34.95
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S27",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -98.49,
          29.42
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S27",
        "title": "Mercado Libre runs Digit at San Antonio fulfilment",
        "date": "2026-06-25",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Industrial / AMR",
        "domain": "Economic",
        "location_type": "Factory",
        "location": "United States; San Antonio, Texas",
        "confidence": "Medium",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.geekwire.com/2026/digit-maker-agility-robotics-to-go-public-in-2-5b-deal-heres-what-the-filings-say-about-its-finances/",
        "status": "signal",
        "Details": "June 2026 coverage of Agility’s SPAC confirmed Digit is deployed at Mercado Libre’s San Antonio, Texas fulfilment site under a partnership announced the previous December, alongside GXO, Schaeffler and Toyota Canada. The robot automates tote and sortation work. Mercado Libre is the largest e-commerce operator in Latin America; the Texas node is a US-sited but LatAm-controlled warehouse using a commercial humanoid.",
        "Implication": "Humanoid hours are no longer only Amazon-adjacent US logistics. A LatAm operator running Digit in Texas is a second commercial geography.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -98.49,
          29.42
        ],
        "display_coordinates": [
          -98.49,
          29.42
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S09",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -87.63,
          41.88
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S09",
        "title": "Dexterity and Kawasaki scale 8-DoF warehouse arm",
        "date": "2026-06-27",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Industrial / AMR",
        "domain": "Technological",
        "location_type": "Market",
        "location": "United States; Chicago",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.robotics247.com/article/automate-2026-dexterity-kawasaki-robotics-expand-collaboration-to-scale-physical-ai-for-warehouse-logistics",
        "status": "signal",
        "Details": "At Automate 2026 in Chicago, Kawasaki Robotics and Dexterity expanded collaboration on Kawasaki’s RL030N 8-DoF arm and Dexterity Mech robots for trailer loading and unloading. Dexterity said Mech design requirements shaped the arm; Kawasaki brought production engineering. The companies pair the arm with Dexterity’s Foresight world model. Kawasaki showed the RL030N on its booth as a production-ready platform already used in live logistics environments.",
        "Implication": "Warehouse physical AI is pulling industrial-arm OEMs into custom 8-DoF SKUs. That is a component-shift as much as a software story.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -87.63,
          41.88
        ],
        "display_coordinates": [
          -87.63,
          41.97044
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S07",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -97.74,
          30.27
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S07",
        "title": "Apptronik opens 90,000 sq ft Robot Park",
        "date": "2026-06-30",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Autonomy stack",
        "domain": "Technological",
        "location_type": "Lab/hospital",
        "location": "United States; Austin, Texas",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.forbes.com/sites/johnkoetsier/2026/06/30/apptronik-announces-robot-park-a-90000-square-foot-humanoid-data-factory-teases-new-robot/",
        "status": "signal",
        "Details": "On 30 June 2026 Apptronik announced Robot Park, a 90,000-square-foot humanoid data-collection and training site in Austin. Fleets of Apollo 2 robots, bipedal and wheeled, run logistics, manufacturing and retail tasks to generate real-world data. CEO Jeff Cardenas called current industry hardware prototypes and said Apollo 3, due next year, will be the first product-grade unit. Apollo 2 remains the data-collection vehicle for scaled pilots.",
        "Implication": "Embodied-AI bottlenecks have shifted from chassis count to labelled hours. A 90k sq ft park is a data capex event, not a customer go-live.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -97.74,
          30.27
        ],
        "display_coordinates": [
          -97.74,
          30.36044
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S23",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -98.58,
          39.83
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S23",
        "title": "NVIDIA tags GR00T N1.7 general release on GitHub",
        "date": "2026-07-07",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Autonomy stack",
        "domain": "Technological",
        "location_type": "Lab/hospital",
        "location": "United States",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://github.com/NVIDIA/Isaac-GR00T/commits",
        "status": "signal",
        "Details": "On 7 July 2026 the NVIDIA/Isaac-GR00T repo recorded a “GR00T N1.7 General Release” commit, after an 18 April early-access tag. N1.7 is a commercially licensed 3B-parameter vision-language-action model pretrained with EgoScale on more than 20,000 hours of human egocentric video across 20-plus task categories. It targets finger-level contact-rich work and is released on GitHub and Hugging Face in LeRobot format. N1.6.1 research weights remain available in parallel.",
        "Implication": "Open humanoid VLAs are now versioned products, not workshop checkpoints. Integrators can pin a tag instead of scraping a research blog.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "USA",
        "truth_coordinates": [
          -98.58,
          39.83
        ],
        "display_coordinates": [
          -99.81477,
          40.27673
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S24",
      "geometry": {
        "type": "Point",
        "coordinates": [
          104.2,
          35.86
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S24",
        "title": "China runs 64 humanoid data-collection centres",
        "date": "2026-07-16",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Autonomy stack",
        "domain": "Political",
        "location_type": "Market",
        "location": "China",
        "confidence": "Medium",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://aiweekly.co/ai-use-cases/use/humanoid-industrial-robots",
        "status": "signal",
        "Details": "On 16 July 2026 reporting on China Ministry of Industry and Information Technology programs said 64 humanoid data-collection centres were operating, 20 more were under construction, and the ministry still targeted 10,000 humanoids on factory floors by year-end. The centres put robots into factories, logistics hubs and stores to gather real-world training data under government backing. That is a data-industrial policy, not a single OEM launch.",
        "Implication": "Whoever owns factory-hour datasets will train the next policy models. Western labs relying on teleop farms now face a state-scale data competitor.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "CHN",
        "truth_coordinates": [
          104.2,
          35.86
        ],
        "display_coordinates": [
          103.45361,
          35.91345
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S13",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -98.58,
          39.83
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S13",
        "title": "FDA authorises J&J Ottava soft-tissue robot",
        "date": "2026-07-22",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Medical/ag/field",
        "domain": "Technological",
        "location_type": "Regulator",
        "location": "United States",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.fiercebiotech.com/medtech/fda-clears-johnson-johnsons-surgical-robot-next-era-surgery",
        "status": "signal",
        "Details": "On 22 July 2026 Johnson & Johnson received FDA de novo authorisation for the Ottava robotic surgical system for multiple general-surgery procedures including Roux-en-Y gastric bypass, gastrectomy, cholecystectomy, splenectomy, gastric sleeve, small-bowel resection, appendectomy, lysis of adhesions, fundoplication and hiatal hernia repair. Four arms sit in a standard table, avoiding a separate boom. J&J will launch with select US customers while inguinal hernia remains in trial.",
        "Implication": "US soft-tissue robotics is no longer a one-vendor market. Capital committees now have Ottava, Hugo and da Vinci to compare on footprint and indication.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "USA",
        "truth_coordinates": [
          -98.58,
          39.83
        ],
        "display_coordinates": [
          -99.6397,
          39.40449
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S08",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -77.72,
          39.64
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S08",
        "title": "FedEx scales Dexterity trailer loading at Hagerstown",
        "date": "2026-07-30",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Industrial / AMR",
        "domain": "Technological",
        "location_type": "Factory",
        "location": "United States; Hagerstown, Maryland",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://dexterity.ai/blog/fedex-hagerstown-physical-ai-deployment",
        "status": "signal",
        "Details": "On 30 July 2026 FedEx and Dexterity said they would scale Foresight world-model and Mech dual-arm trailer loaders at the Hagerstown Hub, moving beyond the Tracy, California pilot. Mech has an 18-foot wingspan, 7.5-foot reach and 60 kg payload and packs mixed cartons into trailers. FedEx loads tens of thousands of trailers a day in the US. In February it had said it wanted automated load/unload on thousands of dock doors across more than 20 hubs.",
        "Implication": "Unstructured trailer work is now a named production scale-up, not a booth demo. That is the hardest remaining warehouse pick-and-place problem.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -77.72,
          39.64
        ],
        "display_coordinates": [
          -77.72,
          39.64
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S10",
      "geometry": {
        "type": "Point",
        "coordinates": [
          104.2,
          35.86
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S10",
        "title": "Geekplus launches RoboShuttle Hyper tote AMR",
        "date": "2026-08-13",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Industrial / AMR",
        "domain": "Technological",
        "location_type": "Market",
        "location": "China",
        "confidence": "Medium",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.robotics247.com/article/geekplus-unveils-roboshuttle-hyper-tote-to-person-climbing-amr",
        "status": "signal",
        "Details": "On 13 August 2026 Geekplus launched RoboShuttle Hyper, a tote-to-person climbing AMR rated at up to 6,000 totes per hour per 1,000 m² for B2C peaks, fresh and cold-chain, consolidation warehouses and micro-fulfilment. The firm’s scheduler is said to coordinate up to 5,000 robots across 50,000 m² and 3 million locations. Hyper joins RoboShuttle Air and Flex. Geekplus has sold tote-handling AMRs since 2018.",
        "Implication": "Tote-to-person density is still the AMR arms race. A 6,000-tote claim resets the RFP ceiling even before independent site hours are published.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "CHN",
        "truth_coordinates": [
          104.2,
          35.86
        ],
        "display_coordinates": [
          104.61928,
          35.48656
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S12",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -86.58,
          35.52
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S12",
        "title": "LG to deploy CLOi AMRs at Tennessee washer plant",
        "date": "2026-08-14",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Industrial / AMR",
        "domain": "Technological",
        "location_type": "Factory",
        "location": "United States; Tennessee",
        "confidence": "Medium",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://aiweekly.co/ai-use-cases/use/humanoid-industrial-robots",
        "status": "signal",
        "Details": "On 14 August 2026 LG said it would deploy CLOi wheel-based robots at its Tennessee washing-machine factory under a new NVIDIA partnership memorandum. The robots are for factory-floor material movement rather than a humanoid form. The announcement sits in a wider 2026 pattern of appliance and auto plants putting mobile robots on named US sites instead of only Korean or Chinese show lines.",
        "Implication": "A named US appliance plant is a stronger industrial signal than another humanoid video. Hours and unit counts are still missing.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -86.58,
          35.52
        ],
        "display_coordinates": [
          -86.58,
          35.52
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S03",
      "geometry": {
        "type": "Point",
        "coordinates": [
          10.45,
          51.17
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S03",
        "title": "Schaeffler opens Humanoid Gym for Hexagon AEON",
        "date": "2026-08-21",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Humanoid / general-purpose",
        "domain": "Technological",
        "location_type": "Factory",
        "location": "Germany",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.assemblymag.com/articles/100337-schaeffler-trains-hexagon-humanoid-robots-for-factory-deployment",
        "status": "signal",
        "Details": "In August 2026 Hexagon Robotics’ AEON humanoid entered Schaeffler’s Humanoid Gym in Germany, a dedicated industrial hall for training, testing and validation before production use. Schaeffler plans at least 1,000 AEON units across its plants in coming years. The companies use a Train–Validate–Deploy model with imitation learning on representative factory tasks. COO Jochen Schröder said the gym is the next step toward industrial reality. Training is expected to support multiple applications in the following six months.",
        "Implication": "A 1,000-unit supplier plan is still a plan, but a named gym with live factory tasks is a deployment precursor, not a teaser video.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "DEU",
        "truth_coordinates": [
          10.45,
          51.17
        ],
        "display_coordinates": [
          10.99195,
          50.79656
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S17",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -93.88,
          42.06
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S17",
        "title": "Carbon opens tractor autonomy to implement makers",
        "date": "2026-09-01",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Medical/ag/field",
        "domain": "Technological",
        "location_type": "Market",
        "location": "United States; Boone, Iowa",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.global-agriculture.com/ag-tech-research-news/carbon-robotics-opens-autonomous-tractor-platform-to-implement-makers/",
        "status": "signal",
        "Details": "On 1 September 2026 Carbon Robotics launched Carbon Autonomy Ready and showed it the following week at the Farm Progress Show with Great Plains Manufacturing as first partner. Great Plains’ HT1100 Terra-Max tillage tool talks to Carbon tractors through Implement Command. The spec is meant to cover planting and spraying later. Carbon frames the program as a response to skilled-operator shortages that limit shift length on owned iron.",
        "Implication": "Autonomy without implement lock-in is how retrofit tractors leave the single-vendor trap. Tillage is the first certified class, not the last.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -93.88,
          42.06
        ],
        "display_coordinates": [
          -93.88,
          42.06
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S19",
      "geometry": {
        "type": "Point",
        "coordinates": [
          4.35,
          50.85
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S19",
        "title": "OJ lists EN ISO 10218-1/2:2025 as harmonised",
        "date": "2026-09-07",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Safety/labour rule",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "European Union; Brussels",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.ibf-solutions.com/en/seminars-and-news/news/new-standards-for-industrial-robots-en-iso-10218-1-and-2",
        "status": "signal",
        "Details": "On 7 September 2026 Commission Implementing Decision (EU) 2026/2015 published references to EN ISO 10218-1:2025 and EN ISO 10218-2:2025 in the Official Journal under Machinery Directive 2006/42/EC. The 2025 editions drop the old cobot product split and treat collaboration as an application risk class. Presumption of conformity under the Directive runs until 20 January 2027, when Regulation (EU) 2023/1230 applies; a fresh OJ list under the Regulation is still pending.",
        "Implication": "CE files started on the 2011 texts now have a dated migration clock. Humanoid and AMR cells will be judged as applications, not as cobot nameplates.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "EU",
        "truth_coordinates": [
          4.35,
          50.85
        ],
        "display_coordinates": [
          4.65849,
          51.00033
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S01",
      "geometry": {
        "type": "Point",
        "coordinates": [
          109.41,
          24.33
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S01",
        "title": "UBTECH Liuzhou plant starts humanoid mass production",
        "date": "2026-09-12",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Humanoid / general-purpose",
        "domain": "Technological",
        "location_type": "Factory",
        "location": "China; Liuzhou, Guangxi",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.globaltimes.cn/page/202609/1370528.shtml",
        "status": "signal",
        "Details": "On 12 September 2026 UBTECH commissioned a 14,000 m², 13.8 m-high factory in Liuzhou designed for 10,000 industrial humanoids a year and a 10-minute takt. The plant, modelled in Siemens Plant Simulation, builds Walker S legged units and wheeled Cruzr robots. Cruzr Y1 and S2 robots plus AGVs and unmanned forklifts handle depalletising, palletising and line-side logistics. A 65 m² store holds 112 finished robots. Foreign software from Siemens Digital Industries was used to design the line.",
        "Implication": "China now has a running 10k-class humanoid factory, not a show line. Component and actuator vendors should treat Walker/Cruzr volumes as a 2026–27 demand signal.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "CHN",
        "truth_coordinates": [
          109.41,
          24.33
        ],
        "display_coordinates": [
          109.41,
          24.33
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S20",
      "geometry": null,
      "properties": {
        "id": "robotics:2026-09-23:S20",
        "title": "ISO 13482 service-robot safety reaches FDIS",
        "date": "2026-09-14",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Safety/labour rule",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "Worldwide",
        "confidence": "High",
        "stakeholder_relevance": "Medium",
        "horizon": "12 months",
        "source_url": "https://www.iso.org/standard/83498.html",
        "status": "signal",
        "Details": "By mid-September 2026 ISO/FDIS 13482 (second edition) sat at stage 50.20 — proof sent or FDIS ballot initiated — and will replace ISO 13482:2014. The draft covers personal and professional service robots and physical human-robot contact, explicitly excluding industrial and medical robots. ISO/TC 299 also lists WG 12 on dynamically stable industrial mobile robots, the track for legged humanoid stability, with ISO 25785-1 still a working draft.",
        "Implication": "Service platforms in public space will soon have a current safety text. Industrial humanoids still wait on 25785-1, so un-caged factory use remains a grey zone.",
        "geom_kind": "none",
        "coord_source": "none",
        "iso3": "",
        "truth_coordinates": null,
        "display_coordinates": null,
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S05",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -123.04,
          44.94
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S05",
        "title": "Agility Digit 5 designed to work outside cages",
        "date": "2026-09-15",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Safety/labour rule",
        "domain": "Technological",
        "location_type": "Actor HQ",
        "location": "United States; Salem, Oregon",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://arstechnica.com/ai/2026/09/agilitys-new-humanoid-robot-will-stop-squat-to-avoid-harming-human-coworkers/",
        "status": "signal",
        "Details": "On 15 September 2026 Agility said Digit 5 uses a safe-motion system that stops or squats when it detects a person, so the robot can work outside physical cages. CTO Pras Velagapudi described mitigations that vary with the type of human presence. Early access is first-half 2027; general availability late 2027. Earlier Digits logged over 65,000 hours at GXO, Schaeffler, Amazon and Toyota Canada. Agility was also reported as first adopter of NVIDIA Halos for Robotics on Digit units at Amazon.",
        "Implication": "Un-caged humanoids change the insurance and ISO 10218 case. Sites cannot treat a 2027 product as a 2026 permit to drop fences.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -123.04,
          44.94
        ],
        "display_coordinates": [
          -122.86855,
          44.80663
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S15",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -98.58,
          39.83
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S15",
        "title": "FDA clears LigaSure tool on Medtronic Hugo",
        "date": "2026-09-16",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Medical/ag/field",
        "domain": "Technological",
        "location_type": "Regulator",
        "location": "United States",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.urologytimes.com/view/fda-clears-ligasure-ras-maryland-instrument-for-use-with-hugo-robotic-surgery-system",
        "status": "signal",
        "Details": "On 16 September 2026 FDA cleared the LigaSure RAS Maryland jaw for exclusive use with Hugo RAS and the Valleylab FT10 energy platform. The tool seals and cuts vessels, thick tissue and lymphatics up to 7 mm. It already held a 2025 CE mark. Hugo itself was cleared for adult MIS urology in December 2025 and commercially launched in the US in February 2026 after Cleveland Clinic’s first case. Medtronic plans filings for general surgery and gynaecology.",
        "Implication": "A cleared energy instrument is what turns a new console into a usable service line. Hugo is no longer a camera-only urology box.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "USA",
        "truth_coordinates": [
          -98.58,
          39.83
        ],
        "display_coordinates": [
          -98.08011,
          38.89373
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S21",
      "geometry": {
        "type": "Point",
        "coordinates": [
          78.96,
          20.59
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S21",
        "title": "India BIS opens draft robotics safety standard",
        "date": "2026-09-16",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Safety/labour rule",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "India",
        "confidence": "Medium",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://robotwale.com/news/india-robotics-standards-draft",
        "status": "signal",
        "Details": "In mid-September 2026 the Bureau of Indian Standards, with MeitY, released a draft Indian Standard on robotics safety covering humanoids, AGVs and cobots. The draft calls for certification testing before market entry, emergency-stop hardware, periodic audits for industrial robots and mandatory data localisation for robots that process citizen data. Domestic makers would comply from the next fiscal quarter; importers face prior registration. Public comment runs 60 days.",
        "Implication": "A large future humanoid and AMR market is writing its own gate. Data localisation plus type testing will slow grey imports more than it slows Tata or Dixon lines.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "IND",
        "truth_coordinates": [
          78.96,
          20.59
        ],
        "display_coordinates": [
          78.96,
          20.59
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S25",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -97.74,
          30.27
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S25",
        "title": "Tesla Optimus Texas factory steel nears close",
        "date": "2026-09-17",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Component/manufacturing",
        "domain": "Economic",
        "location_type": "Factory",
        "location": "United States; Austin, Texas",
        "confidence": "High",
        "stakeholder_relevance": "Adjacent",
        "horizon": "2–5 years",
        "source_url": "https://driveteslacanada.ca/news/tesla-optimus-factory-construction-giga-texas/",
        "status": "signal",
        "Details": "Drone footage posted 17 September 2026 showed the dedicated Optimus factory on Giga Texas North Campus about five column grids from the north perimeter beam, with concrete on three upper floors. Ground was broken in late March and first steel went up in May. Tesla still points to high-volume Texas output in summer 2027 and is converting Fremont lines vacated by Model S/X. Long-term slides still cite million-to-ten-million unit ambitions.",
        "Implication": "A steel box is not a robot. Treat this as manufacturing-capacity capex, and keep 2027 volume on the watchlist until a first unit leaves the dock.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -97.74,
          30.27
        ],
        "display_coordinates": [
          -97.59948,
          30.13663
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S11",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -77.04,
          38.91
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S11",
        "title": "FCC grants ANSCER conditional AMR import approval",
        "date": "2026-09-18",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Safety/labour rule",
        "domain": "Political",
        "location_type": "Regulator",
        "location": "United States; Washington, DC",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.robotics247.com/article/anscer-robotics-secures-fcc-conditional-approval-for-three-amrs",
        "status": "signal",
        "Details": "Effective 18 September 2026 the FCC granted Conditional Approval for ANSCER Robotics’ AR250, AR650 and AR1250 AMRs under the Commission’s Robotic Devices Conditional Approvals in the Covered List program. ANSCER’s US subsidiary in Plano, Texas, said customers can keep deploying the platforms for warehousing, manufacturing and intralogistics. The approval is a security-compliance gate for continued import, not a performance safety mark.",
        "Implication": "Spectrum-and-security lists now sit on the critical path for AMR fleets. A conditional tick is permission to keep selling, not a clean bill of health.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -77.04,
          38.91
        ],
        "display_coordinates": [
          -76.86381,
          38.57562
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S06",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -81.09,
          32.08
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S06",
        "title": "Boston Dynamics opens Atlas hub at Hyundai Metaplant",
        "date": "2026-09-22",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Humanoid / general-purpose",
        "domain": "Technological",
        "location_type": "Factory",
        "location": "United States; Savannah, Georgia",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.automotiveworld.com/news/boston-dynamics-opens-atlas-training-hub-at-hyundai-plant/",
        "status": "signal",
        "Details": "In September 2026 Boston Dynamics opened the Robotics Metaplant Application Center inside Hyundai Motor Group Metaplant America near Savannah. Pilot work began in June; first phase is now operational. Atlas is training on parts logistics and sequencing before line deployment; component assembly is targeted by 2030. HMG plans 25,000 Atlas units across Hyundai and Kia plants and a US factory for up to 30,000 robots a year. RMAC is to move to a ten-times-larger building on the same campus in 2027.",
        "Implication": "Hyundai is treating Atlas as a multi-year plant tool, not a demo. The 25,000-unit figure is a plan; the operational training hall is the in-window fact.",
        "geom_kind": "locality",
        "coord_source": "gazetteer",
        "iso3": "USA",
        "truth_coordinates": [
          -81.09,
          32.08
        ],
        "display_coordinates": [
          -81.09,
          32.08
        ],
        "jitter": false
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S16",
      "geometry": {
        "type": "Point",
        "coordinates": [
          4.35,
          50.85
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S16",
        "title": "Intuitive wins CE mark for da Vinci SP gyn access",
        "date": "2026-09-22",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Medical/ag/field",
        "domain": "Technological",
        "location_type": "Regulator",
        "location": "European Union",
        "confidence": "High",
        "stakeholder_relevance": "High",
        "horizon": "Now",
        "source_url": "https://www.medtechdive.com/news/intuitive-single-port-robot-earns-ce-mark-for-new-indication/830373/",
        "status": "signal",
        "Details": "In the week of 22 September 2026 Intuitive received a CE mark expanding da Vinci SP to transvaginal gynecologic procedures. The 2024 European clearance already covered abdominopelvic, thoracoscopic, transoral, transanal and breast work through one incision or natural orifices. Q2 2026 SP placements were 38, lifting the installed base to 445 and procedure growth to 61 percent. Separate same-week reporting said da Vinci 5 also received CE mark for selected adult cardiac procedures.",
        "Implication": "Indication creep on an installed single-port base is how robotic surgery actually scales in Europe. Cardiac CE on DV5 is a parallel door.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "EU",
        "truth_coordinates": [
          4.35,
          50.85
        ],
        "display_coordinates": [
          3.39187,
          50.90345
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S29",
      "geometry": {
        "type": "Point",
        "coordinates": [
          4.35,
          50.85
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S29",
        "title": "Intuitive da Vinci 5 gets CE mark for cardiac work",
        "date": "2026-09-22",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Medical/ag/field",
        "domain": "Technological",
        "location_type": "Regulator",
        "location": "European Union",
        "confidence": "Medium",
        "stakeholder_relevance": "High",
        "horizon": "12 months",
        "source_url": "https://www.elconfidencial.com/salud/2026-09-22/cirugia-cardiaca-robotica-da-vinci-1hms-1svm_4429074/",
        "status": "signal",
        "Details": "On 22 September 2026 Intuitive said da Vinci 5 received CE mark for adult cardiac procedures, including thoracoscopic-assisted cardiotomy and minimally invasive coronary bypass. Teams can operate through small incisions rather than splitting the sternum. DV5 is described as having 10,000-times the compute of prior generations and instruments that capture more than 1,000 data points a second. Europe-specific Class III cardiac tools and a training ecosystem accompany the mark.",
        "Implication": "Cardiac is a high-skill, high-liability indication. A CE mark reopens European robotic heart programs that had stalled on older platforms.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "EU",
        "truth_coordinates": [
          4.35,
          50.85
        ],
        "display_coordinates": [
          4.14182,
          50.10194
        ],
        "jitter": true
      }
    },
    {
      "type": "Feature",
      "id": "robotics:2026-09-23:S30",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -98.58,
          39.83
        ]
      },
      "properties": {
        "id": "robotics:2026-09-23:S30",
        "title": "Hyundai plans US plant for 30,000 Atlas a year",
        "date": "2026-09-22",
        "module": "Robotics",
        "module_slug": "robotics",
        "subtheme": "Component/manufacturing",
        "domain": "Economic",
        "location_type": "Factory",
        "location": "United States",
        "confidence": "Medium",
        "stakeholder_relevance": "Medium",
        "horizon": "2–5 years",
        "source_url": "https://biz.heraldcorp.com/article/10881502",
        "status": "signal",
        "Details": "Alongside the RMAC opening, Hyundai Motor Group said it will build a US facility capable of 30,000 Atlas robots a year to support a multi-year plan for 25,000 units across Hyundai and Kia plants. Boston Dynamics CPO Zack Jackowski framed the work as physical AI at enterprise scale and said supply-chain, production, test and deployment are being lined up together. The factory itself is not yet producing; RMAC is the in-window operating asset.",
        "Implication": "Three continents now have named humanoid factories in build or run (Liuzhou, Texas, Hyundai US). Capacity announcements will outrun certified safe applications.",
        "geom_kind": "country-centroid",
        "coord_source": "country-centroid",
        "iso3": "USA",
        "truth_coordinates": [
          -98.58,
          39.83
        ],
        "display_coordinates": [
          -97.23097,
          40.15714
        ],
        "jitter": true
      }
    }
  ]
};
