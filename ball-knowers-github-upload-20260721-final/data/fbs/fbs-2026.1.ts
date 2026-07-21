import type { ConferenceId, QuizDataset, Team } from "./types";

const conferences: QuizDataset["conferences"] = {
  acc: { label: "ACC", shortLabel: "ACC", sortOrder: 10, expectedTeams: 17 },
  american: { label: "American", shortLabel: "AAC", sortOrder: 20, expectedTeams: 14 },
  big12: { label: "Big 12", shortLabel: "B12", sortOrder: 30, expectedTeams: 16 },
  "big-ten": { label: "Big Ten", shortLabel: "B1G", sortOrder: 40, expectedTeams: 18 },
  cusa: { label: "Conference USA", shortLabel: "CUSA", sortOrder: 50, expectedTeams: 10 },
  mac: { label: "MAC", shortLabel: "MAC", sortOrder: 60, expectedTeams: 13 },
  "mountain-west": { label: "Mountain West", shortLabel: "MW", sortOrder: 70, expectedTeams: 10 },
  pac12: { label: "Pac-12", shortLabel: "P12", sortOrder: 80, expectedTeams: 8 },
  sec: { label: "SEC", shortLabel: "SEC", sortOrder: 90, expectedTeams: 16 },
  "sun-belt": { label: "Sun Belt", shortLabel: "SBC", sortOrder: 100, expectedTeams: 14 },
  independent: { label: "Independents", shortLabel: "IND", sortOrder: 110, expectedTeams: 2 }
};

const SOURCE_NOTES = {
  laTechSunBelt:
    "Louisiana Tech athletics release, March 13, 2026: 2026 schedule includes eight Sun Belt games and frames the season as a Sun Belt return.",
  mw2026:
    "Mountain West 2026 standings/source material list UTEP, North Dakota State and Northern Illinois in the Mountain West.",
  mac2026:
    "MAC 2026 standings/source material list Sacramento State and Massachusetts in the MAC.",
  texasStatePac12:
    "2026 source material treats Texas State as the Pac-12's eighth football-playing member."
} as const;

type TeamInput = {
  id: string;
  school: string;
  nickname: string;
  city: string;
  state: string;
  conference: ConferenceId;
  aliases?: string[];
  easyAliases?: string[];
  mediumAliases?: string[];
  hardAnswers?: string[];
  cascadeGroup?: string[];
  sourceNotes?: string[];
};

function team(input: TeamInput): Team {
  const canonical = [input.school, ...(input.aliases ?? [])];
  return {
    id: input.id,
    school: input.school,
    displaySchool: input.school,
    nickname: input.nickname,
    city: input.city,
    state: input.state,
    enrollment: null,
    conference: input.conference,
    formerConferences: [],
    firstFootballYear: null,
    joinedFbs: null,
    season: 2026,
    aliases: canonical,
    easyAliases: [...canonical, ...(input.easyAliases ?? [])],
    mediumAliases: [...canonical, ...(input.mediumAliases ?? [])],
    hardAnswers: [input.school, ...(input.hardAnswers ?? [])],
    cascadeGroup: input.cascadeGroup,
    sourceNotes: input.sourceNotes
  };
}

const teams: Team[] = [
  team({ id: "boston-college", school: "Boston College", nickname: "Eagles", city: "Chestnut Hill", state: "MA", conference: "acc", aliases: ["BC"], hardAnswers: ["BC"] }),
  team({ id: "california", school: "California", nickname: "Golden Bears", city: "Berkeley", state: "CA", conference: "acc", aliases: ["Cal", "UC Berkeley"], mediumAliases: ["Cal"], hardAnswers: ["Cal"] }),
  team({ id: "clemson", school: "Clemson", nickname: "Tigers", city: "Clemson", state: "SC", conference: "acc" }),
  team({ id: "duke", school: "Duke", nickname: "Blue Devils", city: "Durham", state: "NC", conference: "acc" }),
  team({ id: "florida-state", school: "Florida State", nickname: "Seminoles", city: "Tallahassee", state: "FL", conference: "acc", aliases: ["FSU"], hardAnswers: ["FSU"], cascadeGroup: ["florida-family"] }),
  team({ id: "georgia-tech", school: "Georgia Tech", nickname: "Yellow Jackets", city: "Atlanta", state: "GA", conference: "acc", aliases: ["Georgia Institute of Technology", "GT"], hardAnswers: ["GT"], cascadeGroup: ["georgia-family"] }),
  team({ id: "louisville", school: "Louisville", nickname: "Cardinals", city: "Louisville", state: "KY", conference: "acc" }),
  team({ id: "miami-fl", school: "Miami (FL)", nickname: "Hurricanes", city: "Coral Gables", state: "FL", conference: "acc", aliases: ["Miami", "Miami FL", "Miami Florida", "University of Miami", "The U"], mediumAliases: ["Miami", "Miami FL", "Miami Florida"], hardAnswers: ["Miami", "Miami FL", "Miami Florida"] }),
  team({ id: "nc-state", school: "NC State", nickname: "Wolfpack", city: "Raleigh", state: "NC", conference: "acc", aliases: ["North Carolina State", "NCSU"], mediumAliases: ["North Carolina State"], hardAnswers: ["North Carolina State", "NCSU"] }),
  team({ id: "north-carolina", school: "North Carolina", nickname: "Tar Heels", city: "Chapel Hill", state: "NC", conference: "acc", aliases: ["UNC"], hardAnswers: ["UNC"] }),
  team({ id: "pittsburgh", school: "Pittsburgh", nickname: "Panthers", city: "Pittsburgh", state: "PA", conference: "acc", aliases: ["Pitt"], mediumAliases: ["Pitt"], hardAnswers: ["Pitt"] }),
  team({ id: "smu", school: "SMU", nickname: "Mustangs", city: "Dallas", state: "TX", conference: "acc", aliases: ["Southern Methodist"], mediumAliases: ["Southern Methodist"], hardAnswers: ["Southern Methodist", "SMU"] }),
  team({ id: "stanford", school: "Stanford", nickname: "Cardinal", city: "Stanford", state: "CA", conference: "acc" }),
  team({ id: "syracuse", school: "Syracuse", nickname: "Orange", city: "Syracuse", state: "NY", conference: "acc" }),
  team({ id: "virginia", school: "Virginia", nickname: "Cavaliers", city: "Charlottesville", state: "VA", conference: "acc", aliases: ["UVA"], hardAnswers: ["UVA"] }),
  team({ id: "virginia-tech", school: "Virginia Tech", nickname: "Hokies", city: "Blacksburg", state: "VA", conference: "acc", aliases: ["VT"], hardAnswers: ["VT"] }),
  team({ id: "wake-forest", school: "Wake Forest", nickname: "Demon Deacons", city: "Winston-Salem", state: "NC", conference: "acc" }),

  team({ id: "army", school: "Army", nickname: "Black Knights", city: "West Point", state: "NY", conference: "american", aliases: ["Army West Point"], hardAnswers: ["Army West Point"] }),
  team({ id: "charlotte", school: "Charlotte", nickname: "49ers", city: "Charlotte", state: "NC", conference: "american" }),
  team({ id: "east-carolina", school: "East Carolina", nickname: "Pirates", city: "Greenville", state: "NC", conference: "american", aliases: ["ECU"], hardAnswers: ["ECU"] }),
  team({ id: "florida-atlantic", school: "Florida Atlantic", nickname: "Owls", city: "Boca Raton", state: "FL", conference: "american", aliases: ["FAU"], hardAnswers: ["FAU"], cascadeGroup: ["florida-family"] }),
  team({ id: "memphis", school: "Memphis", nickname: "Tigers", city: "Memphis", state: "TN", conference: "american" }),
  team({ id: "navy", school: "Navy", nickname: "Midshipmen", city: "Annapolis", state: "MD", conference: "american", aliases: ["Naval Academy"], hardAnswers: ["Naval Academy"] }),
  team({ id: "north-texas", school: "North Texas", nickname: "Mean Green", city: "Denton", state: "TX", conference: "american", aliases: ["UNT"], hardAnswers: ["UNT"] }),
  team({ id: "rice", school: "Rice", nickname: "Owls", city: "Houston", state: "TX", conference: "american" }),
  team({ id: "south-florida", school: "South Florida", nickname: "Bulls", city: "Tampa", state: "FL", conference: "american", aliases: ["USF"], hardAnswers: ["USF"] }),
  team({ id: "temple", school: "Temple", nickname: "Owls", city: "Philadelphia", state: "PA", conference: "american" }),
  team({ id: "tulane", school: "Tulane", nickname: "Green Wave", city: "New Orleans", state: "LA", conference: "american" }),
  team({ id: "tulsa", school: "Tulsa", nickname: "Golden Hurricane", city: "Tulsa", state: "OK", conference: "american" }),
  team({ id: "uab", school: "UAB", nickname: "Blazers", city: "Birmingham", state: "AL", conference: "american", aliases: ["Alabama Birmingham"], mediumAliases: ["Alabama Birmingham"], hardAnswers: ["Alabama Birmingham", "UAB"] }),
  team({ id: "utsa", school: "UTSA", nickname: "Roadrunners", city: "San Antonio", state: "TX", conference: "american", aliases: ["Texas San Antonio", "UT San Antonio"], mediumAliases: ["Texas San Antonio"], hardAnswers: ["Texas San Antonio", "UTSA"] }),

  team({ id: "arizona", school: "Arizona", nickname: "Wildcats", city: "Tucson", state: "AZ", conference: "big12", cascadeGroup: ["arizona-family"] }),
  team({ id: "arizona-state", school: "Arizona State", nickname: "Sun Devils", city: "Tempe", state: "AZ", conference: "big12", aliases: ["ASU"], hardAnswers: ["ASU"], cascadeGroup: ["arizona-family"] }),
  team({ id: "baylor", school: "Baylor", nickname: "Bears", city: "Waco", state: "TX", conference: "big12" }),
  team({ id: "byu", school: "BYU", nickname: "Cougars", city: "Provo", state: "UT", conference: "big12", aliases: ["Brigham Young"], mediumAliases: ["Brigham Young"], hardAnswers: ["Brigham Young", "BYU"] }),
  team({ id: "cincinnati", school: "Cincinnati", nickname: "Bearcats", city: "Cincinnati", state: "OH", conference: "big12" }),
  team({ id: "colorado", school: "Colorado", nickname: "Buffaloes", city: "Boulder", state: "CO", conference: "big12" }),
  team({ id: "houston", school: "Houston", nickname: "Cougars", city: "Houston", state: "TX", conference: "big12" }),
  team({ id: "iowa-state", school: "Iowa State", nickname: "Cyclones", city: "Ames", state: "IA", conference: "big12", aliases: ["ISU"] }),
  team({ id: "kansas", school: "Kansas", nickname: "Jayhawks", city: "Lawrence", state: "KS", conference: "big12", aliases: ["KU"], hardAnswers: ["KU"], cascadeGroup: ["kansas-family"] }),
  team({ id: "kansas-state", school: "Kansas State", nickname: "Wildcats", city: "Manhattan", state: "KS", conference: "big12", aliases: ["K State", "K-State", "KSU"], hardAnswers: ["K State", "KSU"], cascadeGroup: ["kansas-family"] }),
  team({ id: "oklahoma-state", school: "Oklahoma State", nickname: "Cowboys", city: "Stillwater", state: "OK", conference: "big12", aliases: ["OK State", "OSU"], cascadeGroup: ["oklahoma-family"] }),
  team({ id: "tcu", school: "TCU", nickname: "Horned Frogs", city: "Fort Worth", state: "TX", conference: "big12", aliases: ["Texas Christian"], mediumAliases: ["Texas Christian"], hardAnswers: ["Texas Christian", "TCU"] }),
  team({ id: "texas-tech", school: "Texas Tech", nickname: "Red Raiders", city: "Lubbock", state: "TX", conference: "big12", aliases: ["TTU"], hardAnswers: ["TTU"], cascadeGroup: ["texas-family"] }),
  team({ id: "ucf", school: "UCF", nickname: "Knights", city: "Orlando", state: "FL", conference: "big12", aliases: ["Central Florida"], mediumAliases: ["Central Florida"], hardAnswers: ["Central Florida", "UCF"] }),
  team({ id: "utah", school: "Utah", nickname: "Utes", city: "Salt Lake City", state: "UT", conference: "big12" }),
  team({ id: "west-virginia", school: "West Virginia", nickname: "Mountaineers", city: "Morgantown", state: "WV", conference: "big12", aliases: ["WVU"], hardAnswers: ["WVU"] }),

  team({ id: "illinois", school: "Illinois", nickname: "Fighting Illini", city: "Champaign", state: "IL", conference: "big-ten" }),
  team({ id: "indiana", school: "Indiana", nickname: "Hoosiers", city: "Bloomington", state: "IN", conference: "big-ten" }),
  team({ id: "iowa", school: "Iowa", nickname: "Hawkeyes", city: "Iowa City", state: "IA", conference: "big-ten" }),
  team({ id: "maryland", school: "Maryland", nickname: "Terrapins", city: "College Park", state: "MD", conference: "big-ten" }),
  team({ id: "michigan", school: "Michigan", nickname: "Wolverines", city: "Ann Arbor", state: "MI", conference: "big-ten", cascadeGroup: ["michigan-family"] }),
  team({ id: "michigan-state", school: "Michigan State", nickname: "Spartans", city: "East Lansing", state: "MI", conference: "big-ten", aliases: ["MSU"], cascadeGroup: ["michigan-family"] }),
  team({ id: "minnesota", school: "Minnesota", nickname: "Golden Gophers", city: "Minneapolis", state: "MN", conference: "big-ten" }),
  team({ id: "nebraska", school: "Nebraska", nickname: "Cornhuskers", city: "Lincoln", state: "NE", conference: "big-ten" }),
  team({ id: "northwestern", school: "Northwestern", nickname: "Wildcats", city: "Evanston", state: "IL", conference: "big-ten" }),
  team({ id: "ohio-state", school: "Ohio State", nickname: "Buckeyes", city: "Columbus", state: "OH", conference: "big-ten", aliases: ["OSU Buckeyes"], cascadeGroup: ["ohio-family"] }),
  team({ id: "oregon", school: "Oregon", nickname: "Ducks", city: "Eugene", state: "OR", conference: "big-ten", cascadeGroup: ["oregon-family"] }),
  team({ id: "penn-state", school: "Penn State", nickname: "Nittany Lions", city: "University Park", state: "PA", conference: "big-ten", aliases: ["Pennsylvania State", "PSU"], hardAnswers: ["PSU"] }),
  team({ id: "purdue", school: "Purdue", nickname: "Boilermakers", city: "West Lafayette", state: "IN", conference: "big-ten" }),
  team({ id: "rutgers", school: "Rutgers", nickname: "Scarlet Knights", city: "Piscataway", state: "NJ", conference: "big-ten" }),
  team({ id: "ucla", school: "UCLA", nickname: "Bruins", city: "Los Angeles", state: "CA", conference: "big-ten", aliases: ["California Los Angeles"], mediumAliases: ["California Los Angeles"], hardAnswers: ["California Los Angeles", "UCLA"] }),
  team({ id: "usc", school: "USC", nickname: "Trojans", city: "Los Angeles", state: "CA", conference: "big-ten", aliases: ["Southern California"], mediumAliases: ["Southern California"], hardAnswers: ["Southern California", "USC"] }),
  team({ id: "washington", school: "Washington", nickname: "Huskies", city: "Seattle", state: "WA", conference: "big-ten", aliases: ["UW"], cascadeGroup: ["washington-family"] }),
  team({ id: "wisconsin", school: "Wisconsin", nickname: "Badgers", city: "Madison", state: "WI", conference: "big-ten" }),

  team({ id: "delaware", school: "Delaware", nickname: "Blue Hens", city: "Newark", state: "DE", conference: "cusa" }),
  team({ id: "fiu", school: "FIU", nickname: "Panthers", city: "Miami", state: "FL", conference: "cusa", aliases: ["Florida International"], mediumAliases: ["Florida International"], hardAnswers: ["Florida International", "FIU"] }),
  team({ id: "jacksonville-state", school: "Jacksonville State", nickname: "Gamecocks", city: "Jacksonville", state: "AL", conference: "cusa", aliases: ["Jax State", "JSU"] }),
  team({ id: "kennesaw-state", school: "Kennesaw State", nickname: "Owls", city: "Kennesaw", state: "GA", conference: "cusa", aliases: ["KSU Owls"] }),
  team({ id: "liberty", school: "Liberty", nickname: "Flames", city: "Lynchburg", state: "VA", conference: "cusa" }),
  team({ id: "middle-tennessee", school: "Middle Tennessee", nickname: "Blue Raiders", city: "Murfreesboro", state: "TN", conference: "cusa", aliases: ["MTSU", "Middle Tennessee State"], mediumAliases: ["Middle Tennessee State"], hardAnswers: ["Middle Tennessee State", "MTSU"] }),
  team({ id: "missouri-state", school: "Missouri State", nickname: "Bears", city: "Springfield", state: "MO", conference: "cusa" }),
  team({ id: "new-mexico-state", school: "New Mexico State", nickname: "Aggies", city: "Las Cruces", state: "NM", conference: "cusa", aliases: ["NMSU"], cascadeGroup: ["new-mexico-family"] }),
  team({ id: "sam-houston", school: "Sam Houston", nickname: "Bearkats", city: "Huntsville", state: "TX", conference: "cusa", aliases: ["Sam Houston State", "SHSU"], mediumAliases: ["Sam Houston State"], hardAnswers: ["Sam Houston State", "SHSU"] }),
  team({ id: "western-kentucky", school: "Western Kentucky", nickname: "Hilltoppers", city: "Bowling Green", state: "KY", conference: "cusa", aliases: ["WKU"], hardAnswers: ["WKU"] }),

  team({ id: "akron", school: "Akron", nickname: "Zips", city: "Akron", state: "OH", conference: "mac" }),
  team({ id: "ball-state", school: "Ball State", nickname: "Cardinals", city: "Muncie", state: "IN", conference: "mac" }),
  team({ id: "bowling-green", school: "Bowling Green", nickname: "Falcons", city: "Bowling Green", state: "OH", conference: "mac", aliases: ["BGSU"], hardAnswers: ["BGSU"] }),
  team({ id: "buffalo", school: "Buffalo", nickname: "Bulls", city: "Buffalo", state: "NY", conference: "mac" }),
  team({ id: "central-michigan", school: "Central Michigan", nickname: "Chippewas", city: "Mount Pleasant", state: "MI", conference: "mac", aliases: ["CMU"] }),
  team({ id: "eastern-michigan", school: "Eastern Michigan", nickname: "Eagles", city: "Ypsilanti", state: "MI", conference: "mac", aliases: ["EMU"] }),
  team({ id: "kent-state", school: "Kent State", nickname: "Golden Flashes", city: "Kent", state: "OH", conference: "mac" }),
  team({ id: "massachusetts", school: "Massachusetts", nickname: "Minutemen", city: "Amherst", state: "MA", conference: "mac", aliases: ["UMass", "U Mass"], mediumAliases: ["UMass"], hardAnswers: ["UMass"], sourceNotes: [SOURCE_NOTES.mac2026] }),
  team({ id: "miami-oh", school: "Miami (OH)", nickname: "RedHawks", city: "Oxford", state: "OH", conference: "mac", aliases: ["Miami OH", "Miami Ohio"], mediumAliases: ["Miami OH", "Miami Ohio"], hardAnswers: ["Miami OH", "Miami Ohio"] }),
  team({ id: "ohio", school: "Ohio", nickname: "Bobcats", city: "Athens", state: "OH", conference: "mac", cascadeGroup: ["ohio-family"] }),
  team({ id: "sacramento-state", school: "Sacramento State", nickname: "Hornets", city: "Sacramento", state: "CA", conference: "mac", aliases: ["Sac State"], mediumAliases: ["Sac State"], hardAnswers: ["Sac State"], sourceNotes: [SOURCE_NOTES.mac2026] }),
  team({ id: "toledo", school: "Toledo", nickname: "Rockets", city: "Toledo", state: "OH", conference: "mac" }),
  team({ id: "western-michigan", school: "Western Michigan", nickname: "Broncos", city: "Kalamazoo", state: "MI", conference: "mac", aliases: ["WMU"] }),

  team({ id: "air-force", school: "Air Force", nickname: "Falcons", city: "Colorado Springs", state: "CO", conference: "mountain-west", aliases: ["AFA"] }),
  team({ id: "hawaii", school: "Hawaii", nickname: "Rainbow Warriors", city: "Honolulu", state: "HI", conference: "mountain-west", aliases: ["Hawai'i", "Hawaiʻi", "Hawai‘i"], mediumAliases: ["Hawai'i", "Hawaiʻi"], hardAnswers: ["Hawai'i", "Hawaiʻi"] }),
  team({ id: "nevada", school: "Nevada", nickname: "Wolf Pack", city: "Reno", state: "NV", conference: "mountain-west" }),
  team({ id: "new-mexico", school: "New Mexico", nickname: "Lobos", city: "Albuquerque", state: "NM", conference: "mountain-west", aliases: ["UNM"], cascadeGroup: ["new-mexico-family"] }),
  team({ id: "north-dakota-state", school: "North Dakota State", nickname: "Bison", city: "Fargo", state: "ND", conference: "mountain-west", aliases: ["NDSU"], mediumAliases: ["NDSU"], hardAnswers: ["NDSU"], sourceNotes: [SOURCE_NOTES.mw2026] }),
  team({ id: "northern-illinois", school: "Northern Illinois", nickname: "Huskies", city: "DeKalb", state: "IL", conference: "mountain-west", aliases: ["NIU"], mediumAliases: ["NIU"], hardAnswers: ["NIU"], sourceNotes: [SOURCE_NOTES.mw2026] }),
  team({ id: "san-jose-state", school: "San Jose State", nickname: "Spartans", city: "San Jose", state: "CA", conference: "mountain-west", aliases: ["San José State", "SJSU"], mediumAliases: ["San José State"], hardAnswers: ["SJSU"] }),
  team({ id: "unlv", school: "UNLV", nickname: "Rebels", city: "Las Vegas", state: "NV", conference: "mountain-west", aliases: ["Nevada Las Vegas"], mediumAliases: ["Nevada Las Vegas"], hardAnswers: ["Nevada Las Vegas", "UNLV"] }),
  team({ id: "utep", school: "UTEP", nickname: "Miners", city: "El Paso", state: "TX", conference: "mountain-west", aliases: ["Texas El Paso", "UT El Paso"], mediumAliases: ["Texas El Paso"], hardAnswers: ["Texas El Paso", "UTEP"], sourceNotes: [SOURCE_NOTES.mw2026] }),
  team({ id: "wyoming", school: "Wyoming", nickname: "Cowboys", city: "Laramie", state: "WY", conference: "mountain-west" }),

  team({ id: "boise-state", school: "Boise State", nickname: "Broncos", city: "Boise", state: "ID", conference: "pac12" }),
  team({ id: "colorado-state", school: "Colorado State", nickname: "Rams", city: "Fort Collins", state: "CO", conference: "pac12", aliases: ["CSU Rams"] }),
  team({ id: "fresno-state", school: "Fresno State", nickname: "Bulldogs", city: "Fresno", state: "CA", conference: "pac12" }),
  team({ id: "oregon-state", school: "Oregon State", nickname: "Beavers", city: "Corvallis", state: "OR", conference: "pac12", cascadeGroup: ["oregon-family"] }),
  team({ id: "san-diego-state", school: "San Diego State", nickname: "Aztecs", city: "San Diego", state: "CA", conference: "pac12", aliases: ["SDSU"], hardAnswers: ["SDSU"] }),
  team({ id: "texas-state", school: "Texas State", nickname: "Bobcats", city: "San Marcos", state: "TX", conference: "pac12", aliases: ["TXST"], cascadeGroup: ["texas-family"], sourceNotes: [SOURCE_NOTES.texasStatePac12] }),
  team({ id: "utah-state", school: "Utah State", nickname: "Aggies", city: "Logan", state: "UT", conference: "pac12", aliases: ["USU"] }),
  team({ id: "washington-state", school: "Washington State", nickname: "Cougars", city: "Pullman", state: "WA", conference: "pac12", aliases: ["Wazzu", "WSU"], hardAnswers: ["WSU"], cascadeGroup: ["washington-family"] }),

  team({ id: "alabama", school: "Alabama", nickname: "Crimson Tide", city: "Tuscaloosa", state: "AL", conference: "sec" }),
  team({ id: "arkansas", school: "Arkansas", nickname: "Razorbacks", city: "Fayetteville", state: "AR", conference: "sec", cascadeGroup: ["arkansas-family"] }),
  team({ id: "auburn", school: "Auburn", nickname: "Tigers", city: "Auburn", state: "AL", conference: "sec" }),
  team({ id: "florida", school: "Florida", nickname: "Gators", city: "Gainesville", state: "FL", conference: "sec", cascadeGroup: ["florida-family"] }),
  team({ id: "georgia", school: "Georgia", nickname: "Bulldogs", city: "Athens", state: "GA", conference: "sec", aliases: ["UGA"], cascadeGroup: ["georgia-family"] }),
  team({ id: "kentucky", school: "Kentucky", nickname: "Wildcats", city: "Lexington", state: "KY", conference: "sec" }),
  team({ id: "lsu", school: "LSU", nickname: "Tigers", city: "Baton Rouge", state: "LA", conference: "sec", aliases: ["Louisiana State"], mediumAliases: ["Louisiana State"], hardAnswers: ["Louisiana State", "LSU"] }),
  team({ id: "mississippi-state", school: "Mississippi State", nickname: "Bulldogs", city: "Starkville", state: "MS", conference: "sec", aliases: ["MS State"], cascadeGroup: ["mississippi-family"] }),
  team({ id: "missouri", school: "Missouri", nickname: "Tigers", city: "Columbia", state: "MO", conference: "sec", aliases: ["Mizzou"], mediumAliases: ["Mizzou"], hardAnswers: ["Mizzou"] }),
  team({ id: "oklahoma", school: "Oklahoma", nickname: "Sooners", city: "Norman", state: "OK", conference: "sec", cascadeGroup: ["oklahoma-family"] }),
  team({ id: "ole-miss", school: "Ole Miss", nickname: "Rebels", city: "Oxford", state: "MS", conference: "sec", aliases: ["Mississippi"], mediumAliases: ["Mississippi"], hardAnswers: ["Mississippi"], cascadeGroup: ["mississippi-family"] }),
  team({ id: "south-carolina", school: "South Carolina", nickname: "Gamecocks", city: "Columbia", state: "SC", conference: "sec", aliases: ["SCAR"] }),
  team({ id: "tennessee", school: "Tennessee", nickname: "Volunteers", city: "Knoxville", state: "TN", conference: "sec" }),
  team({ id: "texas", school: "Texas", nickname: "Longhorns", city: "Austin", state: "TX", conference: "sec", cascadeGroup: ["texas-family"] }),
  team({ id: "texas-am", school: "Texas A&M", nickname: "Aggies", city: "College Station", state: "TX", conference: "sec", aliases: ["Texas AM", "Texas A and M", "TAMU"], mediumAliases: ["Texas AM", "Texas A and M", "TAMU"], hardAnswers: ["Texas AM", "Texas A and M", "TAMU"], cascadeGroup: ["texas-family"] }),
  team({ id: "vanderbilt", school: "Vanderbilt", nickname: "Commodores", city: "Nashville", state: "TN", conference: "sec" }),

  team({ id: "appalachian-state", school: "Appalachian State", nickname: "Mountaineers", city: "Boone", state: "NC", conference: "sun-belt", aliases: ["App State", "Appalachian"], mediumAliases: ["App State"], hardAnswers: ["App State"] }),
  team({ id: "arkansas-state", school: "Arkansas State", nickname: "Red Wolves", city: "Jonesboro", state: "AR", conference: "sun-belt", aliases: ["A State"], cascadeGroup: ["arkansas-family"] }),
  team({ id: "coastal-carolina", school: "Coastal Carolina", nickname: "Chanticleers", city: "Conway", state: "SC", conference: "sun-belt" }),
  team({ id: "georgia-southern", school: "Georgia Southern", nickname: "Eagles", city: "Statesboro", state: "GA", conference: "sun-belt", cascadeGroup: ["georgia-family"] }),
  team({ id: "georgia-state", school: "Georgia State", nickname: "Panthers", city: "Atlanta", state: "GA", conference: "sun-belt", cascadeGroup: ["georgia-family"] }),
  team({ id: "james-madison", school: "James Madison", nickname: "Dukes", city: "Harrisonburg", state: "VA", conference: "sun-belt", aliases: ["JMU"], hardAnswers: ["JMU"] }),
  team({ id: "louisiana", school: "Louisiana", nickname: "Ragin' Cajuns", city: "Lafayette", state: "LA", conference: "sun-belt", aliases: ["Louisiana Lafayette", "Louisiana-Lafayette", "UL Lafayette", "ULL"], mediumAliases: ["Louisiana Lafayette", "UL Lafayette"], hardAnswers: ["Louisiana Lafayette"], cascadeGroup: ["louisiana-family"] }),
  team({ id: "louisiana-tech", school: "Louisiana Tech", nickname: "Bulldogs", city: "Ruston", state: "LA", conference: "sun-belt", aliases: ["LA Tech", "La Tech"], mediumAliases: ["LA Tech"], hardAnswers: ["LA Tech"], cascadeGroup: ["louisiana-family"], sourceNotes: [SOURCE_NOTES.laTechSunBelt] }),
  team({ id: "marshall", school: "Marshall", nickname: "Thundering Herd", city: "Huntington", state: "WV", conference: "sun-belt" }),
  team({ id: "old-dominion", school: "Old Dominion", nickname: "Monarchs", city: "Norfolk", state: "VA", conference: "sun-belt", aliases: ["ODU"], hardAnswers: ["ODU"] }),
  team({ id: "south-alabama", school: "South Alabama", nickname: "Jaguars", city: "Mobile", state: "AL", conference: "sun-belt", aliases: ["USA Jaguars"] }),
  team({ id: "southern-miss", school: "Southern Miss", nickname: "Golden Eagles", city: "Hattiesburg", state: "MS", conference: "sun-belt", aliases: ["Southern Mississippi", "USM"], mediumAliases: ["Southern Mississippi"], hardAnswers: ["Southern Mississippi", "USM"] }),
  team({ id: "troy", school: "Troy", nickname: "Trojans", city: "Troy", state: "AL", conference: "sun-belt" }),
  team({ id: "ulm", school: "ULM", nickname: "Warhawks", city: "Monroe", state: "LA", conference: "sun-belt", aliases: ["Louisiana Monroe", "Louisiana-Monroe", "UL Monroe"], mediumAliases: ["Louisiana Monroe"], hardAnswers: ["Louisiana Monroe", "ULM"] }),

  team({ id: "notre-dame", school: "Notre Dame", nickname: "Fighting Irish", city: "Notre Dame", state: "IN", conference: "independent", aliases: ["ND"] }),
  team({ id: "uconn", school: "UConn", nickname: "Huskies", city: "Storrs", state: "CT", conference: "independent", aliases: ["Connecticut", "U Conn"], mediumAliases: ["Connecticut"], hardAnswers: ["Connecticut", "UConn"] })
];

export const fbs2026Dataset: QuizDataset = {
  quizId: "fbs-schools-2026",
  datasetVersion: "fbs-2026.1",
  season: 2026,
  title: "Name Every Current FBS College Football Team",
  generatedAt: "2026-07-13T00:00:00.000Z",
  conferences,
  teams
};

export const expectedConferenceTotals: Record<ConferenceId, number> = {
  acc: 17,
  american: 14,
  big12: 16,
  "big-ten": 18,
  cusa: 10,
  mac: 13,
  "mountain-west": 10,
  pac12: 8,
  sec: 16,
  "sun-belt": 14,
  independent: 2
};
