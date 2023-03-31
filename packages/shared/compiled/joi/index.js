;(function () {
  'use strict'
  var e = {
    579: function (e, t, r) {
      const n = r(7310)
      const s = r(2740)
      const i = {
        minDomainSegments: 2,
        nonAsciiRx: /[^\x00-\x7f]/,
        domainControlRx: /[\x00-\x20@\:\/]/,
        tldSegmentRx: /^[a-zA-Z](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?$/,
        domainSegmentRx: /^[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?$/,
        URL: n.URL || URL,
      }
      t.analyze = function (e, t = {}) {
        if (typeof e !== 'string') {
          throw new Error('Invalid input: domain must be a string')
        }
        if (!e) {
          return s.code('DOMAIN_NON_EMPTY_STRING')
        }
        if (e.length > 256) {
          return s.code('DOMAIN_TOO_LONG')
        }
        const r = !i.nonAsciiRx.test(e)
        if (!r) {
          if (t.allowUnicode === false) {
            return s.code('DOMAIN_INVALID_UNICODE_CHARS')
          }
          e = e.normalize('NFC')
        }
        if (i.domainControlRx.test(e)) {
          return s.code('DOMAIN_INVALID_CHARS')
        }
        e = i.punycode(e)
        const n = t.minDomainSegments || i.minDomainSegments
        const o = e.split('.')
        if (o.length < n) {
          return s.code('DOMAIN_SEGMENTS_COUNT')
        }
        if (t.maxDomainSegments) {
          if (o.length > t.maxDomainSegments) {
            return s.code('DOMAIN_SEGMENTS_COUNT_MAX')
          }
        }
        const a = t.tlds
        if (a) {
          const e = o[o.length - 1].toLowerCase()
          if ((a.deny && a.deny.has(e)) || (a.allow && !a.allow.has(e))) {
            return s.code('DOMAIN_FORBIDDEN_TLDS')
          }
        }
        for (let e = 0; e < o.length; ++e) {
          const t = o[e]
          if (!t.length) {
            return s.code('DOMAIN_EMPTY_SEGMENT')
          }
          if (t.length > 63) {
            return s.code('DOMAIN_LONG_SEGMENT')
          }
          if (e < o.length - 1) {
            if (!i.domainSegmentRx.test(t)) {
              return s.code('DOMAIN_INVALID_CHARS')
            }
          } else {
            if (!i.tldSegmentRx.test(t)) {
              return s.code('DOMAIN_INVALID_TLDS_CHARS')
            }
          }
        }
        return null
      }
      t.isValid = function (e, r) {
        return !t.analyze(e, r)
      }
      i.punycode = function (e) {
        try {
          return new i.URL(`http://${e}`).host
        } catch (t) {
          return e
        }
      }
    },
    1700: function (e, t, r) {
      const n = r(3837)
      const s = r(579)
      const i = r(2740)
      const o = {
        nonAsciiRx: /[^\x00-\x7f]/,
        encoder: new (n.TextEncoder || TextEncoder)(),
      }
      t.analyze = function (e, t) {
        return o.email(e, t)
      }
      t.isValid = function (e, t) {
        return !o.email(e, t)
      }
      o.email = function (e, t = {}) {
        if (typeof e !== 'string') {
          throw new Error('Invalid input: email must be a string')
        }
        if (!e) {
          return i.code('EMPTY_STRING')
        }
        const r = !o.nonAsciiRx.test(e)
        if (!r) {
          if (t.allowUnicode === false) {
            return i.code('FORBIDDEN_UNICODE')
          }
          e = e.normalize('NFC')
        }
        const n = e.split('@')
        if (n.length !== 2) {
          return n.length > 2
            ? i.code('MULTIPLE_AT_CHAR')
            : i.code('MISSING_AT_CHAR')
        }
        const [a, l] = n
        if (!a) {
          return i.code('EMPTY_LOCAL')
        }
        if (!t.ignoreLength) {
          if (e.length > 254) {
            return i.code('ADDRESS_TOO_LONG')
          }
          if (o.encoder.encode(a).length > 64) {
            return i.code('LOCAL_TOO_LONG')
          }
        }
        return o.local(a, r) || s.analyze(l, t)
      }
      o.local = function (e, t) {
        const r = e.split('.')
        for (const e of r) {
          if (!e.length) {
            return i.code('EMPTY_LOCAL_SEGMENT')
          }
          if (t) {
            if (!o.atextRx.test(e)) {
              return i.code('INVALID_LOCAL_CHARS')
            }
            continue
          }
          for (const t of e) {
            if (o.atextRx.test(t)) {
              continue
            }
            const e = o.binary(t)
            if (!o.atomRx.test(e)) {
              return i.code('INVALID_LOCAL_CHARS')
            }
          }
        }
      }
      o.binary = function (e) {
        return Array.from(o.encoder.encode(e))
          .map((e) => String.fromCharCode(e))
          .join('')
      }
      o.atextRx = /^[\w!#\$%&'\*\+\-/=\?\^`\{\|\}~]+$/
      o.atomRx = new RegExp(
        [
          '(?:[\\xc2-\\xdf][\\x80-\\xbf])',
          '(?:\\xe0[\\xa0-\\xbf][\\x80-\\xbf])|(?:[\\xe1-\\xec][\\x80-\\xbf]{2})|(?:\\xed[\\x80-\\x9f][\\x80-\\xbf])|(?:[\\xee-\\xef][\\x80-\\xbf]{2})',
          '(?:\\xf0[\\x90-\\xbf][\\x80-\\xbf]{2})|(?:[\\xf1-\\xf3][\\x80-\\xbf]{3})|(?:\\xf4[\\x80-\\x8f][\\x80-\\xbf]{2})',
        ].join('|')
      )
    },
    2740: function (e, t) {
      t.codes = {
        EMPTY_STRING: 'Address must be a non-empty string',
        FORBIDDEN_UNICODE: 'Address contains forbidden Unicode characters',
        MULTIPLE_AT_CHAR: 'Address cannot contain more than one @ character',
        MISSING_AT_CHAR: 'Address must contain one @ character',
        EMPTY_LOCAL: 'Address local part cannot be empty',
        ADDRESS_TOO_LONG: 'Address too long',
        LOCAL_TOO_LONG: 'Address local part too long',
        EMPTY_LOCAL_SEGMENT:
          'Address local part contains empty dot-separated segment',
        INVALID_LOCAL_CHARS: 'Address local part contains invalid character',
        DOMAIN_NON_EMPTY_STRING: 'Domain must be a non-empty string',
        DOMAIN_TOO_LONG: 'Domain too long',
        DOMAIN_INVALID_UNICODE_CHARS:
          'Domain contains forbidden Unicode characters',
        DOMAIN_INVALID_CHARS: 'Domain contains invalid character',
        DOMAIN_INVALID_TLDS_CHARS: 'Domain contains invalid tld character',
        DOMAIN_SEGMENTS_COUNT:
          'Domain lacks the minimum required number of segments',
        DOMAIN_SEGMENTS_COUNT_MAX: 'Domain contains too many segments',
        DOMAIN_FORBIDDEN_TLDS: 'Domain uses forbidden TLD',
        DOMAIN_EMPTY_SEGMENT: 'Domain contains empty dot-separated segment',
        DOMAIN_LONG_SEGMENT:
          'Domain contains dot-separated segment that is too long',
      }
      t.code = function (e) {
        return { code: e, error: t.codes[e] }
      }
    },
    8892: function (e, t, r) {
      const n = r(8309)
      const s = r(4673)
      const i = {}
      t.regex = function (e = {}) {
        n(
          e.cidr === undefined || typeof e.cidr === 'string',
          'options.cidr must be a string'
        )
        const t = e.cidr ? e.cidr.toLowerCase() : 'optional'
        n(
          ['required', 'optional', 'forbidden'].includes(t),
          'options.cidr must be one of required, optional, forbidden'
        )
        n(
          e.version === undefined ||
            typeof e.version === 'string' ||
            Array.isArray(e.version),
          'options.version must be a string or an array of string'
        )
        let r = e.version || ['ipv4', 'ipv6', 'ipvfuture']
        if (!Array.isArray(r)) {
          r = [r]
        }
        n(
          r.length >= 1,
          'options.version must have at least 1 version specified'
        )
        for (let e = 0; e < r.length; ++e) {
          n(
            typeof r[e] === 'string',
            'options.version must only contain strings'
          )
          r[e] = r[e].toLowerCase()
          n(
            ['ipv4', 'ipv6', 'ipvfuture'].includes(r[e]),
            'options.version contains unknown version ' +
              r[e] +
              ' - must be one of ipv4, ipv6, ipvfuture'
          )
        }
        r = Array.from(new Set(r))
        const i = r.map((e) => {
          if (t === 'forbidden') {
            return s.ip[e]
          }
          const r = `\\/${e === 'ipv4' ? s.ip.v4Cidr : s.ip.v6Cidr}`
          if (t === 'required') {
            return `${s.ip[e]}${r}`
          }
          return `${s.ip[e]}(?:${r})?`
        })
        const o = `(?:${i.join('|')})`
        const a = new RegExp(`^${o}$`)
        return { cidr: t, versions: r, regex: a, raw: o }
      }
    },
    6250: function (e) {
      const t = {}
      t.tlds = [
        'AAA',
        'AARP',
        'ABARTH',
        'ABB',
        'ABBOTT',
        'ABBVIE',
        'ABC',
        'ABLE',
        'ABOGADO',
        'ABUDHABI',
        'AC',
        'ACADEMY',
        'ACCENTURE',
        'ACCOUNTANT',
        'ACCOUNTANTS',
        'ACO',
        'ACTOR',
        'AD',
        'ADAC',
        'ADS',
        'ADULT',
        'AE',
        'AEG',
        'AERO',
        'AETNA',
        'AF',
        'AFAMILYCOMPANY',
        'AFL',
        'AFRICA',
        'AG',
        'AGAKHAN',
        'AGENCY',
        'AI',
        'AIG',
        'AIGO',
        'AIRBUS',
        'AIRFORCE',
        'AIRTEL',
        'AKDN',
        'AL',
        'ALFAROMEO',
        'ALIBABA',
        'ALIPAY',
        'ALLFINANZ',
        'ALLSTATE',
        'ALLY',
        'ALSACE',
        'ALSTOM',
        'AM',
        'AMERICANEXPRESS',
        'AMERICANFAMILY',
        'AMEX',
        'AMFAM',
        'AMICA',
        'AMSTERDAM',
        'ANALYTICS',
        'ANDROID',
        'ANQUAN',
        'ANZ',
        'AO',
        'AOL',
        'APARTMENTS',
        'APP',
        'APPLE',
        'AQ',
        'AQUARELLE',
        'AR',
        'ARAB',
        'ARAMCO',
        'ARCHI',
        'ARMY',
        'ARPA',
        'ART',
        'ARTE',
        'AS',
        'ASDA',
        'ASIA',
        'ASSOCIATES',
        'AT',
        'ATHLETA',
        'ATTORNEY',
        'AU',
        'AUCTION',
        'AUDI',
        'AUDIBLE',
        'AUDIO',
        'AUSPOST',
        'AUTHOR',
        'AUTO',
        'AUTOS',
        'AVIANCA',
        'AW',
        'AWS',
        'AX',
        'AXA',
        'AZ',
        'AZURE',
        'BA',
        'BABY',
        'BAIDU',
        'BANAMEX',
        'BANANAREPUBLIC',
        'BAND',
        'BANK',
        'BAR',
        'BARCELONA',
        'BARCLAYCARD',
        'BARCLAYS',
        'BAREFOOT',
        'BARGAINS',
        'BASEBALL',
        'BASKETBALL',
        'BAUHAUS',
        'BAYERN',
        'BB',
        'BBC',
        'BBT',
        'BBVA',
        'BCG',
        'BCN',
        'BD',
        'BE',
        'BEATS',
        'BEAUTY',
        'BEER',
        'BENTLEY',
        'BERLIN',
        'BEST',
        'BESTBUY',
        'BET',
        'BF',
        'BG',
        'BH',
        'BHARTI',
        'BI',
        'BIBLE',
        'BID',
        'BIKE',
        'BING',
        'BINGO',
        'BIO',
        'BIZ',
        'BJ',
        'BLACK',
        'BLACKFRIDAY',
        'BLOCKBUSTER',
        'BLOG',
        'BLOOMBERG',
        'BLUE',
        'BM',
        'BMS',
        'BMW',
        'BN',
        'BNPPARIBAS',
        'BO',
        'BOATS',
        'BOEHRINGER',
        'BOFA',
        'BOM',
        'BOND',
        'BOO',
        'BOOK',
        'BOOKING',
        'BOSCH',
        'BOSTIK',
        'BOSTON',
        'BOT',
        'BOUTIQUE',
        'BOX',
        'BR',
        'BRADESCO',
        'BRIDGESTONE',
        'BROADWAY',
        'BROKER',
        'BROTHER',
        'BRUSSELS',
        'BS',
        'BT',
        'BUDAPEST',
        'BUGATTI',
        'BUILD',
        'BUILDERS',
        'BUSINESS',
        'BUY',
        'BUZZ',
        'BV',
        'BW',
        'BY',
        'BZ',
        'BZH',
        'CA',
        'CAB',
        'CAFE',
        'CAL',
        'CALL',
        'CALVINKLEIN',
        'CAM',
        'CAMERA',
        'CAMP',
        'CANCERRESEARCH',
        'CANON',
        'CAPETOWN',
        'CAPITAL',
        'CAPITALONE',
        'CAR',
        'CARAVAN',
        'CARDS',
        'CARE',
        'CAREER',
        'CAREERS',
        'CARS',
        'CARTIER',
        'CASA',
        'CASE',
        'CASEIH',
        'CASH',
        'CASINO',
        'CAT',
        'CATERING',
        'CATHOLIC',
        'CBA',
        'CBN',
        'CBRE',
        'CBS',
        'CC',
        'CD',
        'CEB',
        'CENTER',
        'CEO',
        'CERN',
        'CF',
        'CFA',
        'CFD',
        'CG',
        'CH',
        'CHANEL',
        'CHANNEL',
        'CHARITY',
        'CHASE',
        'CHAT',
        'CHEAP',
        'CHINTAI',
        'CHRISTMAS',
        'CHROME',
        'CHRYSLER',
        'CHURCH',
        'CI',
        'CIPRIANI',
        'CIRCLE',
        'CISCO',
        'CITADEL',
        'CITI',
        'CITIC',
        'CITY',
        'CITYEATS',
        'CK',
        'CL',
        'CLAIMS',
        'CLEANING',
        'CLICK',
        'CLINIC',
        'CLINIQUE',
        'CLOTHING',
        'CLOUD',
        'CLUB',
        'CLUBMED',
        'CM',
        'CN',
        'CO',
        'COACH',
        'CODES',
        'COFFEE',
        'COLLEGE',
        'COLOGNE',
        'COM',
        'COMCAST',
        'COMMBANK',
        'COMMUNITY',
        'COMPANY',
        'COMPARE',
        'COMPUTER',
        'COMSEC',
        'CONDOS',
        'CONSTRUCTION',
        'CONSULTING',
        'CONTACT',
        'CONTRACTORS',
        'COOKING',
        'COOKINGCHANNEL',
        'COOL',
        'COOP',
        'CORSICA',
        'COUNTRY',
        'COUPON',
        'COUPONS',
        'COURSES',
        'CR',
        'CREDIT',
        'CREDITCARD',
        'CREDITUNION',
        'CRICKET',
        'CROWN',
        'CRS',
        'CRUISE',
        'CRUISES',
        'CSC',
        'CU',
        'CUISINELLA',
        'CV',
        'CW',
        'CX',
        'CY',
        'CYMRU',
        'CYOU',
        'CZ',
        'DABUR',
        'DAD',
        'DANCE',
        'DATA',
        'DATE',
        'DATING',
        'DATSUN',
        'DAY',
        'DCLK',
        'DDS',
        'DE',
        'DEAL',
        'DEALER',
        'DEALS',
        'DEGREE',
        'DELIVERY',
        'DELL',
        'DELOITTE',
        'DELTA',
        'DEMOCRAT',
        'DENTAL',
        'DENTIST',
        'DESI',
        'DESIGN',
        'DEV',
        'DHL',
        'DIAMONDS',
        'DIET',
        'DIGITAL',
        'DIRECT',
        'DIRECTORY',
        'DISCOUNT',
        'DISCOVER',
        'DISH',
        'DIY',
        'DJ',
        'DK',
        'DM',
        'DNP',
        'DO',
        'DOCS',
        'DOCTOR',
        'DODGE',
        'DOG',
        'DOMAINS',
        'DOT',
        'DOWNLOAD',
        'DRIVE',
        'DTV',
        'DUBAI',
        'DUCK',
        'DUNLOP',
        'DUPONT',
        'DURBAN',
        'DVAG',
        'DVR',
        'DZ',
        'EARTH',
        'EAT',
        'EC',
        'ECO',
        'EDEKA',
        'EDU',
        'EDUCATION',
        'EE',
        'EG',
        'EMAIL',
        'EMERCK',
        'ENERGY',
        'ENGINEER',
        'ENGINEERING',
        'ENTERPRISES',
        'EPSON',
        'EQUIPMENT',
        'ER',
        'ERICSSON',
        'ERNI',
        'ES',
        'ESQ',
        'ESTATE',
        'ESURANCE',
        'ET',
        'ETISALAT',
        'EU',
        'EUROVISION',
        'EUS',
        'EVENTS',
        'EVERBANK',
        'EXCHANGE',
        'EXPERT',
        'EXPOSED',
        'EXPRESS',
        'EXTRASPACE',
        'FAGE',
        'FAIL',
        'FAIRWINDS',
        'FAITH',
        'FAMILY',
        'FAN',
        'FANS',
        'FARM',
        'FARMERS',
        'FASHION',
        'FAST',
        'FEDEX',
        'FEEDBACK',
        'FERRARI',
        'FERRERO',
        'FI',
        'FIAT',
        'FIDELITY',
        'FIDO',
        'FILM',
        'FINAL',
        'FINANCE',
        'FINANCIAL',
        'FIRE',
        'FIRESTONE',
        'FIRMDALE',
        'FISH',
        'FISHING',
        'FIT',
        'FITNESS',
        'FJ',
        'FK',
        'FLICKR',
        'FLIGHTS',
        'FLIR',
        'FLORIST',
        'FLOWERS',
        'FLY',
        'FM',
        'FO',
        'FOO',
        'FOOD',
        'FOODNETWORK',
        'FOOTBALL',
        'FORD',
        'FOREX',
        'FORSALE',
        'FORUM',
        'FOUNDATION',
        'FOX',
        'FR',
        'FREE',
        'FRESENIUS',
        'FRL',
        'FROGANS',
        'FRONTDOOR',
        'FRONTIER',
        'FTR',
        'FUJITSU',
        'FUJIXEROX',
        'FUN',
        'FUND',
        'FURNITURE',
        'FUTBOL',
        'FYI',
        'GA',
        'GAL',
        'GALLERY',
        'GALLO',
        'GALLUP',
        'GAME',
        'GAMES',
        'GAP',
        'GARDEN',
        'GAY',
        'GB',
        'GBIZ',
        'GD',
        'GDN',
        'GE',
        'GEA',
        'GENT',
        'GENTING',
        'GEORGE',
        'GF',
        'GG',
        'GGEE',
        'GH',
        'GI',
        'GIFT',
        'GIFTS',
        'GIVES',
        'GIVING',
        'GL',
        'GLADE',
        'GLASS',
        'GLE',
        'GLOBAL',
        'GLOBO',
        'GM',
        'GMAIL',
        'GMBH',
        'GMO',
        'GMX',
        'GN',
        'GODADDY',
        'GOLD',
        'GOLDPOINT',
        'GOLF',
        'GOO',
        'GOODYEAR',
        'GOOG',
        'GOOGLE',
        'GOP',
        'GOT',
        'GOV',
        'GP',
        'GQ',
        'GR',
        'GRAINGER',
        'GRAPHICS',
        'GRATIS',
        'GREEN',
        'GRIPE',
        'GROCERY',
        'GROUP',
        'GS',
        'GT',
        'GU',
        'GUARDIAN',
        'GUCCI',
        'GUGE',
        'GUIDE',
        'GUITARS',
        'GURU',
        'GW',
        'GY',
        'HAIR',
        'HAMBURG',
        'HANGOUT',
        'HAUS',
        'HBO',
        'HDFC',
        'HDFCBANK',
        'HEALTH',
        'HEALTHCARE',
        'HELP',
        'HELSINKI',
        'HERE',
        'HERMES',
        'HGTV',
        'HIPHOP',
        'HISAMITSU',
        'HITACHI',
        'HIV',
        'HK',
        'HKT',
        'HM',
        'HN',
        'HOCKEY',
        'HOLDINGS',
        'HOLIDAY',
        'HOMEDEPOT',
        'HOMEGOODS',
        'HOMES',
        'HOMESENSE',
        'HONDA',
        'HORSE',
        'HOSPITAL',
        'HOST',
        'HOSTING',
        'HOT',
        'HOTELES',
        'HOTELS',
        'HOTMAIL',
        'HOUSE',
        'HOW',
        'HR',
        'HSBC',
        'HT',
        'HU',
        'HUGHES',
        'HYATT',
        'HYUNDAI',
        'IBM',
        'ICBC',
        'ICE',
        'ICU',
        'ID',
        'IE',
        'IEEE',
        'IFM',
        'IKANO',
        'IL',
        'IM',
        'IMAMAT',
        'IMDB',
        'IMMO',
        'IMMOBILIEN',
        'IN',
        'INC',
        'INDUSTRIES',
        'INFINITI',
        'INFO',
        'ING',
        'INK',
        'INSTITUTE',
        'INSURANCE',
        'INSURE',
        'INT',
        'INTEL',
        'INTERNATIONAL',
        'INTUIT',
        'INVESTMENTS',
        'IO',
        'IPIRANGA',
        'IQ',
        'IR',
        'IRISH',
        'IS',
        'ISMAILI',
        'IST',
        'ISTANBUL',
        'IT',
        'ITAU',
        'ITV',
        'IVECO',
        'JAGUAR',
        'JAVA',
        'JCB',
        'JCP',
        'JE',
        'JEEP',
        'JETZT',
        'JEWELRY',
        'JIO',
        'JLL',
        'JM',
        'JMP',
        'JNJ',
        'JO',
        'JOBS',
        'JOBURG',
        'JOT',
        'JOY',
        'JP',
        'JPMORGAN',
        'JPRS',
        'JUEGOS',
        'JUNIPER',
        'KAUFEN',
        'KDDI',
        'KE',
        'KERRYHOTELS',
        'KERRYLOGISTICS',
        'KERRYPROPERTIES',
        'KFH',
        'KG',
        'KH',
        'KI',
        'KIA',
        'KIM',
        'KINDER',
        'KINDLE',
        'KITCHEN',
        'KIWI',
        'KM',
        'KN',
        'KOELN',
        'KOMATSU',
        'KOSHER',
        'KP',
        'KPMG',
        'KPN',
        'KR',
        'KRD',
        'KRED',
        'KUOKGROUP',
        'KW',
        'KY',
        'KYOTO',
        'KZ',
        'LA',
        'LACAIXA',
        'LADBROKES',
        'LAMBORGHINI',
        'LAMER',
        'LANCASTER',
        'LANCIA',
        'LANCOME',
        'LAND',
        'LANDROVER',
        'LANXESS',
        'LASALLE',
        'LAT',
        'LATINO',
        'LATROBE',
        'LAW',
        'LAWYER',
        'LB',
        'LC',
        'LDS',
        'LEASE',
        'LECLERC',
        'LEFRAK',
        'LEGAL',
        'LEGO',
        'LEXUS',
        'LGBT',
        'LI',
        'LIAISON',
        'LIDL',
        'LIFE',
        'LIFEINSURANCE',
        'LIFESTYLE',
        'LIGHTING',
        'LIKE',
        'LILLY',
        'LIMITED',
        'LIMO',
        'LINCOLN',
        'LINDE',
        'LINK',
        'LIPSY',
        'LIVE',
        'LIVING',
        'LIXIL',
        'LK',
        'LLC',
        'LOAN',
        'LOANS',
        'LOCKER',
        'LOCUS',
        'LOFT',
        'LOL',
        'LONDON',
        'LOTTE',
        'LOTTO',
        'LOVE',
        'LPL',
        'LPLFINANCIAL',
        'LR',
        'LS',
        'LT',
        'LTD',
        'LTDA',
        'LU',
        'LUNDBECK',
        'LUPIN',
        'LUXE',
        'LUXURY',
        'LV',
        'LY',
        'MA',
        'MACYS',
        'MADRID',
        'MAIF',
        'MAISON',
        'MAKEUP',
        'MAN',
        'MANAGEMENT',
        'MANGO',
        'MAP',
        'MARKET',
        'MARKETING',
        'MARKETS',
        'MARRIOTT',
        'MARSHALLS',
        'MASERATI',
        'MATTEL',
        'MBA',
        'MC',
        'MCKINSEY',
        'MD',
        'ME',
        'MED',
        'MEDIA',
        'MEET',
        'MELBOURNE',
        'MEME',
        'MEMORIAL',
        'MEN',
        'MENU',
        'MERCKMSD',
        'METLIFE',
        'MG',
        'MH',
        'MIAMI',
        'MICROSOFT',
        'MIL',
        'MINI',
        'MINT',
        'MIT',
        'MITSUBISHI',
        'MK',
        'ML',
        'MLB',
        'MLS',
        'MM',
        'MMA',
        'MN',
        'MO',
        'MOBI',
        'MOBILE',
        'MODA',
        'MOE',
        'MOI',
        'MOM',
        'MONASH',
        'MONEY',
        'MONSTER',
        'MOPAR',
        'MORMON',
        'MORTGAGE',
        'MOSCOW',
        'MOTO',
        'MOTORCYCLES',
        'MOV',
        'MOVIE',
        'MOVISTAR',
        'MP',
        'MQ',
        'MR',
        'MS',
        'MSD',
        'MT',
        'MTN',
        'MTR',
        'MU',
        'MUSEUM',
        'MUTUAL',
        'MV',
        'MW',
        'MX',
        'MY',
        'MZ',
        'NA',
        'NAB',
        'NADEX',
        'NAGOYA',
        'NAME',
        'NATIONWIDE',
        'NATURA',
        'NAVY',
        'NBA',
        'NC',
        'NE',
        'NEC',
        'NET',
        'NETBANK',
        'NETFLIX',
        'NETWORK',
        'NEUSTAR',
        'NEW',
        'NEWHOLLAND',
        'NEWS',
        'NEXT',
        'NEXTDIRECT',
        'NEXUS',
        'NF',
        'NFL',
        'NG',
        'NGO',
        'NHK',
        'NI',
        'NICO',
        'NIKE',
        'NIKON',
        'NINJA',
        'NISSAN',
        'NISSAY',
        'NL',
        'NO',
        'NOKIA',
        'NORTHWESTERNMUTUAL',
        'NORTON',
        'NOW',
        'NOWRUZ',
        'NOWTV',
        'NP',
        'NR',
        'NRA',
        'NRW',
        'NTT',
        'NU',
        'NYC',
        'NZ',
        'OBI',
        'OBSERVER',
        'OFF',
        'OFFICE',
        'OKINAWA',
        'OLAYAN',
        'OLAYANGROUP',
        'OLDNAVY',
        'OLLO',
        'OM',
        'OMEGA',
        'ONE',
        'ONG',
        'ONL',
        'ONLINE',
        'ONYOURSIDE',
        'OOO',
        'OPEN',
        'ORACLE',
        'ORANGE',
        'ORG',
        'ORGANIC',
        'ORIGINS',
        'OSAKA',
        'OTSUKA',
        'OTT',
        'OVH',
        'PA',
        'PAGE',
        'PANASONIC',
        'PARIS',
        'PARS',
        'PARTNERS',
        'PARTS',
        'PARTY',
        'PASSAGENS',
        'PAY',
        'PCCW',
        'PE',
        'PET',
        'PF',
        'PFIZER',
        'PG',
        'PH',
        'PHARMACY',
        'PHD',
        'PHILIPS',
        'PHONE',
        'PHOTO',
        'PHOTOGRAPHY',
        'PHOTOS',
        'PHYSIO',
        'PIAGET',
        'PICS',
        'PICTET',
        'PICTURES',
        'PID',
        'PIN',
        'PING',
        'PINK',
        'PIONEER',
        'PIZZA',
        'PK',
        'PL',
        'PLACE',
        'PLAY',
        'PLAYSTATION',
        'PLUMBING',
        'PLUS',
        'PM',
        'PN',
        'PNC',
        'POHL',
        'POKER',
        'POLITIE',
        'PORN',
        'POST',
        'PR',
        'PRAMERICA',
        'PRAXI',
        'PRESS',
        'PRIME',
        'PRO',
        'PROD',
        'PRODUCTIONS',
        'PROF',
        'PROGRESSIVE',
        'PROMO',
        'PROPERTIES',
        'PROPERTY',
        'PROTECTION',
        'PRU',
        'PRUDENTIAL',
        'PS',
        'PT',
        'PUB',
        'PW',
        'PWC',
        'PY',
        'QA',
        'QPON',
        'QUEBEC',
        'QUEST',
        'QVC',
        'RACING',
        'RADIO',
        'RAID',
        'RE',
        'READ',
        'REALESTATE',
        'REALTOR',
        'REALTY',
        'RECIPES',
        'RED',
        'REDSTONE',
        'REDUMBRELLA',
        'REHAB',
        'REISE',
        'REISEN',
        'REIT',
        'RELIANCE',
        'REN',
        'RENT',
        'RENTALS',
        'REPAIR',
        'REPORT',
        'REPUBLICAN',
        'REST',
        'RESTAURANT',
        'REVIEW',
        'REVIEWS',
        'REXROTH',
        'RICH',
        'RICHARDLI',
        'RICOH',
        'RIGHTATHOME',
        'RIL',
        'RIO',
        'RIP',
        'RMIT',
        'RO',
        'ROCHER',
        'ROCKS',
        'RODEO',
        'ROGERS',
        'ROOM',
        'RS',
        'RSVP',
        'RU',
        'RUGBY',
        'RUHR',
        'RUN',
        'RW',
        'RWE',
        'RYUKYU',
        'SA',
        'SAARLAND',
        'SAFE',
        'SAFETY',
        'SAKURA',
        'SALE',
        'SALON',
        'SAMSCLUB',
        'SAMSUNG',
        'SANDVIK',
        'SANDVIKCOROMANT',
        'SANOFI',
        'SAP',
        'SARL',
        'SAS',
        'SAVE',
        'SAXO',
        'SB',
        'SBI',
        'SBS',
        'SC',
        'SCA',
        'SCB',
        'SCHAEFFLER',
        'SCHMIDT',
        'SCHOLARSHIPS',
        'SCHOOL',
        'SCHULE',
        'SCHWARZ',
        'SCIENCE',
        'SCJOHNSON',
        'SCOR',
        'SCOT',
        'SD',
        'SE',
        'SEARCH',
        'SEAT',
        'SECURE',
        'SECURITY',
        'SEEK',
        'SELECT',
        'SENER',
        'SERVICES',
        'SES',
        'SEVEN',
        'SEW',
        'SEX',
        'SEXY',
        'SFR',
        'SG',
        'SH',
        'SHANGRILA',
        'SHARP',
        'SHAW',
        'SHELL',
        'SHIA',
        'SHIKSHA',
        'SHOES',
        'SHOP',
        'SHOPPING',
        'SHOUJI',
        'SHOW',
        'SHOWTIME',
        'SHRIRAM',
        'SI',
        'SILK',
        'SINA',
        'SINGLES',
        'SITE',
        'SJ',
        'SK',
        'SKI',
        'SKIN',
        'SKY',
        'SKYPE',
        'SL',
        'SLING',
        'SM',
        'SMART',
        'SMILE',
        'SN',
        'SNCF',
        'SO',
        'SOCCER',
        'SOCIAL',
        'SOFTBANK',
        'SOFTWARE',
        'SOHU',
        'SOLAR',
        'SOLUTIONS',
        'SONG',
        'SONY',
        'SOY',
        'SPACE',
        'SPORT',
        'SPOT',
        'SPREADBETTING',
        'SR',
        'SRL',
        'SRT',
        'SS',
        'ST',
        'STADA',
        'STAPLES',
        'STAR',
        'STATEBANK',
        'STATEFARM',
        'STC',
        'STCGROUP',
        'STOCKHOLM',
        'STORAGE',
        'STORE',
        'STREAM',
        'STUDIO',
        'STUDY',
        'STYLE',
        'SU',
        'SUCKS',
        'SUPPLIES',
        'SUPPLY',
        'SUPPORT',
        'SURF',
        'SURGERY',
        'SUZUKI',
        'SV',
        'SWATCH',
        'SWIFTCOVER',
        'SWISS',
        'SX',
        'SY',
        'SYDNEY',
        'SYMANTEC',
        'SYSTEMS',
        'SZ',
        'TAB',
        'TAIPEI',
        'TALK',
        'TAOBAO',
        'TARGET',
        'TATAMOTORS',
        'TATAR',
        'TATTOO',
        'TAX',
        'TAXI',
        'TC',
        'TCI',
        'TD',
        'TDK',
        'TEAM',
        'TECH',
        'TECHNOLOGY',
        'TEL',
        'TELEFONICA',
        'TEMASEK',
        'TENNIS',
        'TEVA',
        'TF',
        'TG',
        'TH',
        'THD',
        'THEATER',
        'THEATRE',
        'TIAA',
        'TICKETS',
        'TIENDA',
        'TIFFANY',
        'TIPS',
        'TIRES',
        'TIROL',
        'TJ',
        'TJMAXX',
        'TJX',
        'TK',
        'TKMAXX',
        'TL',
        'TM',
        'TMALL',
        'TN',
        'TO',
        'TODAY',
        'TOKYO',
        'TOOLS',
        'TOP',
        'TORAY',
        'TOSHIBA',
        'TOTAL',
        'TOURS',
        'TOWN',
        'TOYOTA',
        'TOYS',
        'TR',
        'TRADE',
        'TRADING',
        'TRAINING',
        'TRAVEL',
        'TRAVELCHANNEL',
        'TRAVELERS',
        'TRAVELERSINSURANCE',
        'TRUST',
        'TRV',
        'TT',
        'TUBE',
        'TUI',
        'TUNES',
        'TUSHU',
        'TV',
        'TVS',
        'TW',
        'TZ',
        'UA',
        'UBANK',
        'UBS',
        'UCONNECT',
        'UG',
        'UK',
        'UNICOM',
        'UNIVERSITY',
        'UNO',
        'UOL',
        'UPS',
        'US',
        'UY',
        'UZ',
        'VA',
        'VACATIONS',
        'VANA',
        'VANGUARD',
        'VC',
        'VE',
        'VEGAS',
        'VENTURES',
        'VERISIGN',
        'VERSICHERUNG',
        'VET',
        'VG',
        'VI',
        'VIAJES',
        'VIDEO',
        'VIG',
        'VIKING',
        'VILLAS',
        'VIN',
        'VIP',
        'VIRGIN',
        'VISA',
        'VISION',
        'VISTAPRINT',
        'VIVA',
        'VIVO',
        'VLAANDEREN',
        'VN',
        'VODKA',
        'VOLKSWAGEN',
        'VOLVO',
        'VOTE',
        'VOTING',
        'VOTO',
        'VOYAGE',
        'VU',
        'VUELOS',
        'WALES',
        'WALMART',
        'WALTER',
        'WANG',
        'WANGGOU',
        'WARMAN',
        'WATCH',
        'WATCHES',
        'WEATHER',
        'WEATHERCHANNEL',
        'WEBCAM',
        'WEBER',
        'WEBSITE',
        'WED',
        'WEDDING',
        'WEIBO',
        'WEIR',
        'WF',
        'WHOSWHO',
        'WIEN',
        'WIKI',
        'WILLIAMHILL',
        'WIN',
        'WINDOWS',
        'WINE',
        'WINNERS',
        'WME',
        'WOLTERSKLUWER',
        'WOODSIDE',
        'WORK',
        'WORKS',
        'WORLD',
        'WOW',
        'WS',
        'WTC',
        'WTF',
        'XBOX',
        'XEROX',
        'XFINITY',
        'XIHUAN',
        'XIN',
        'XN--11B4C3D',
        'XN--1CK2E1B',
        'XN--1QQW23A',
        'XN--2SCRJ9C',
        'XN--30RR7Y',
        'XN--3BST00M',
        'XN--3DS443G',
        'XN--3E0B707E',
        'XN--3HCRJ9C',
        'XN--3OQ18VL8PN36A',
        'XN--3PXU8K',
        'XN--42C2D9A',
        'XN--45BR5CYL',
        'XN--45BRJ9C',
        'XN--45Q11C',
        'XN--4GBRIM',
        'XN--54B7FTA0CC',
        'XN--55QW42G',
        'XN--55QX5D',
        'XN--5SU34J936BGSG',
        'XN--5TZM5G',
        'XN--6FRZ82G',
        'XN--6QQ986B3XL',
        'XN--80ADXHKS',
        'XN--80AO21A',
        'XN--80AQECDR1A',
        'XN--80ASEHDB',
        'XN--80ASWG',
        'XN--8Y0A063A',
        'XN--90A3AC',
        'XN--90AE',
        'XN--90AIS',
        'XN--9DBQ2A',
        'XN--9ET52U',
        'XN--9KRT00A',
        'XN--B4W605FERD',
        'XN--BCK1B9A5DRE4C',
        'XN--C1AVG',
        'XN--C2BR7G',
        'XN--CCK2B3B',
        'XN--CG4BKI',
        'XN--CLCHC0EA0B2G2A9GCD',
        'XN--CZR694B',
        'XN--CZRS0T',
        'XN--CZRU2D',
        'XN--D1ACJ3B',
        'XN--D1ALF',
        'XN--E1A4C',
        'XN--ECKVDTC9D',
        'XN--EFVY88H',
        'XN--ESTV75G',
        'XN--FCT429K',
        'XN--FHBEI',
        'XN--FIQ228C5HS',
        'XN--FIQ64B',
        'XN--FIQS8S',
        'XN--FIQZ9S',
        'XN--FJQ720A',
        'XN--FLW351E',
        'XN--FPCRJ9C3D',
        'XN--FZC2C9E2C',
        'XN--FZYS8D69UVGM',
        'XN--G2XX48C',
        'XN--GCKR3F0F',
        'XN--GECRJ9C',
        'XN--GK3AT1E',
        'XN--H2BREG3EVE',
        'XN--H2BRJ9C',
        'XN--H2BRJ9C8C',
        'XN--HXT814E',
        'XN--I1B6B1A6A2E',
        'XN--IMR513N',
        'XN--IO0A7I',
        'XN--J1AEF',
        'XN--J1AMH',
        'XN--J6W193G',
        'XN--JLQ61U9W7B',
        'XN--JVR189M',
        'XN--KCRX77D1X4A',
        'XN--KPRW13D',
        'XN--KPRY57D',
        'XN--KPU716F',
        'XN--KPUT3I',
        'XN--L1ACC',
        'XN--LGBBAT1AD8J',
        'XN--MGB9AWBF',
        'XN--MGBA3A3EJT',
        'XN--MGBA3A4F16A',
        'XN--MGBA7C0BBN0A',
        'XN--MGBAAKC7DVF',
        'XN--MGBAAM7A8H',
        'XN--MGBAB2BD',
        'XN--MGBAH1A3HJKRD',
        'XN--MGBAI9AZGQP6J',
        'XN--MGBAYH7GPA',
        'XN--MGBBH1A',
        'XN--MGBBH1A71E',
        'XN--MGBC0A9AZCG',
        'XN--MGBCA7DZDO',
        'XN--MGBERP4A5D4AR',
        'XN--MGBGU82A',
        'XN--MGBI4ECEXP',
        'XN--MGBPL2FH',
        'XN--MGBT3DHD',
        'XN--MGBTX2B',
        'XN--MGBX4CD0AB',
        'XN--MIX891F',
        'XN--MK1BU44C',
        'XN--MXTQ1M',
        'XN--NGBC5AZD',
        'XN--NGBE9E0A',
        'XN--NGBRX',
        'XN--NODE',
        'XN--NQV7F',
        'XN--NQV7FS00EMA',
        'XN--NYQY26A',
        'XN--O3CW4H',
        'XN--OGBPF8FL',
        'XN--OTU796D',
        'XN--P1ACF',
        'XN--P1AI',
        'XN--PBT977C',
        'XN--PGBS0DH',
        'XN--PSSY2U',
        'XN--Q9JYB4C',
        'XN--QCKA1PMC',
        'XN--QXA6A',
        'XN--QXAM',
        'XN--RHQV96G',
        'XN--ROVU88B',
        'XN--RVC1E0AM3E',
        'XN--S9BRJ9C',
        'XN--SES554G',
        'XN--T60B56A',
        'XN--TCKWE',
        'XN--TIQ49XQYJ',
        'XN--UNUP4Y',
        'XN--VERMGENSBERATER-CTB',
        'XN--VERMGENSBERATUNG-PWB',
        'XN--VHQUV',
        'XN--VUQ861B',
        'XN--W4R85EL8FHU5DNRA',
        'XN--W4RS40L',
        'XN--WGBH1C',
        'XN--WGBL6A',
        'XN--XHQ521B',
        'XN--XKC2AL3HYE2A',
        'XN--XKC2DL3A5EE0H',
        'XN--Y9A3AQ',
        'XN--YFRO4I67O',
        'XN--YGBI2AMMX',
        'XN--ZFR164B',
        'XXX',
        'XYZ',
        'YACHTS',
        'YAHOO',
        'YAMAXUN',
        'YANDEX',
        'YE',
        'YODOBASHI',
        'YOGA',
        'YOKOHAMA',
        'YOU',
        'YOUTUBE',
        'YT',
        'YUN',
        'ZA',
        'ZAPPOS',
        'ZARA',
        'ZERO',
        'ZIP',
        'ZM',
        'ZONE',
        'ZUERICH',
        'ZW',
      ]
      e.exports = new Set(t.tlds.map((e) => e.toLowerCase()))
    },
    4673: function (e, t, r) {
      const n = r(8309)
      const s = r(9141)
      const i = {}
      i.generate = function () {
        const e = {}
        const t = '\\dA-Fa-f'
        const r = '[' + t + ']'
        const n = '\\w-\\.~'
        const s = "!\\$&'\\(\\)\\*\\+,;="
        const i = '%' + t
        const o = n + i + s + ':@'
        const a = '[' + o + ']'
        const l = '(?:0{0,2}\\d|0?[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])'
        e.ipv4address = '(?:' + l + '\\.){3}' + l
        const c = r + '{1,4}'
        const u = '(?:' + c + ':' + c + '|' + e.ipv4address + ')'
        const f = '(?:' + c + ':){6}' + u
        const d = '::(?:' + c + ':){5}' + u
        const m = '(?:' + c + ')?::(?:' + c + ':){4}' + u
        const h = '(?:(?:' + c + ':){0,1}' + c + ')?::(?:' + c + ':){3}' + u
        const p = '(?:(?:' + c + ':){0,2}' + c + ')?::(?:' + c + ':){2}' + u
        const g = '(?:(?:' + c + ':){0,3}' + c + ')?::' + c + ':' + u
        const y = '(?:(?:' + c + ':){0,4}' + c + ')?::' + u
        const b = '(?:(?:' + c + ':){0,5}' + c + ')?::' + c
        const _ = '(?:(?:' + c + ':){0,6}' + c + ')?::'
        e.ipv4Cidr = '(?:\\d|[1-2]\\d|3[0-2])'
        e.ipv6Cidr = '(?:0{0,2}\\d|0?[1-9]\\d|1[01]\\d|12[0-8])'
        e.ipv6address =
          '(?:' +
          f +
          '|' +
          d +
          '|' +
          m +
          '|' +
          h +
          '|' +
          p +
          '|' +
          g +
          '|' +
          y +
          '|' +
          b +
          '|' +
          _ +
          ')'
        e.ipvFuture = 'v' + r + '+\\.[' + n + s + ':]+'
        e.scheme = '[a-zA-Z][a-zA-Z\\d+-\\.]*'
        e.schemeRegex = new RegExp(e.scheme)
        const A = '[' + n + i + s + ':]*'
        const v = '\\[(?:' + e.ipv6address + '|' + e.ipvFuture + ')\\]'
        const E = '[' + n + i + s + ']{1,255}'
        const R = '(?:' + v + '|' + e.ipv4address + '|' + E + ')'
        const S = '\\d*'
        const O = '(?:' + A + '@)?' + R + '(?::' + S + ')?'
        const N = '(?:' + A + '@)?(' + R + ')(?::' + S + ')?'
        const I = a + '*'
        const w = a + '+'
        const T = '[' + n + i + s + '@' + ']+'
        const $ = ''
        const C = '(?:\\/' + I + ')*'
        const L = '\\/(?:' + w + C + ')?'
        const x = w + C
        const M = T + C
        const D = '(?:\\/\\/\\/' + I + C + ')'
        e.hierPart =
          '(?:' + '(?:\\/\\/' + O + C + ')' + '|' + L + '|' + x + '|' + D + ')'
        e.hierPartCapture =
          '(?:' + '(?:\\/\\/' + N + C + ')' + '|' + L + '|' + x + ')'
        e.relativeRef =
          '(?:' + '(?:\\/\\/' + O + C + ')' + '|' + L + '|' + M + '|' + $ + ')'
        e.relativeRefCapture =
          '(?:' + '(?:\\/\\/' + N + C + ')' + '|' + L + '|' + M + '|' + $ + ')'
        e.query = '[' + o + '\\/\\?]*(?=#|$)'
        e.queryWithSquareBrackets = '[' + o + '\\[\\]\\/\\?]*(?=#|$)'
        e.fragment = '[' + o + '\\/\\?]*'
        return e
      }
      i.rfc3986 = i.generate()
      t.ip = {
        v4Cidr: i.rfc3986.ipv4Cidr,
        v6Cidr: i.rfc3986.ipv6Cidr,
        ipv4: i.rfc3986.ipv4address,
        ipv6: i.rfc3986.ipv6address,
        ipvfuture: i.rfc3986.ipvFuture,
      }
      i.createRegex = function (e) {
        const t = i.rfc3986
        const r = e.allowQuerySquareBrackets
          ? t.queryWithSquareBrackets
          : t.query
        const o = '(?:\\?' + r + ')?' + '(?:#' + t.fragment + ')?'
        const a = e.domain ? t.relativeRefCapture : t.relativeRef
        if (e.relativeOnly) {
          return i.wrap(a + o)
        }
        let l = ''
        if (e.scheme) {
          n(
            e.scheme instanceof RegExp ||
              typeof e.scheme === 'string' ||
              Array.isArray(e.scheme),
            'scheme must be a RegExp, String, or Array'
          )
          const r = [].concat(e.scheme)
          n(r.length >= 1, 'scheme must have at least 1 scheme specified')
          const i = []
          for (let e = 0; e < r.length; ++e) {
            const o = r[e]
            n(
              o instanceof RegExp || typeof o === 'string',
              'scheme at position ' + e + ' must be a RegExp or String'
            )
            if (o instanceof RegExp) {
              i.push(o.source.toString())
            } else {
              n(
                t.schemeRegex.test(o),
                'scheme at position ' + e + ' must be a valid scheme'
              )
              i.push(s(o))
            }
          }
          l = i.join('|')
        }
        const c = l ? '(?:' + l + ')' : t.scheme
        const u =
          '(?:' + c + ':' + (e.domain ? t.hierPartCapture : t.hierPart) + ')'
        const f = e.allowRelative ? '(?:' + u + '|' + a + ')' : u
        return i.wrap(f + o, l)
      }
      i.wrap = function (e, t) {
        e = `(?=.)(?!https?:/$)${e}`
        return { raw: e, regex: new RegExp(`^${e}$`), scheme: t }
      }
      i.uriRegex = i.createRegex({})
      t.regex = function (e = {}) {
        if (
          e.scheme ||
          e.allowRelative ||
          e.relativeOnly ||
          e.allowQuerySquareBrackets ||
          e.domain
        ) {
          return i.createRegex(e)
        }
        return i.uriRegex
      }
    },
    3105: function (e, t) {
      const r = {
        operators: [
          '!',
          '^',
          '*',
          '/',
          '%',
          '+',
          '-',
          '<',
          '<=',
          '>',
          '>=',
          '==',
          '!=',
          '&&',
          '||',
          '??',
        ],
        operatorCharacters: [
          '!',
          '^',
          '*',
          '/',
          '%',
          '+',
          '-',
          '<',
          '=',
          '>',
          '&',
          '|',
          '?',
        ],
        operatorsOrder: [
          ['^'],
          ['*', '/', '%'],
          ['+', '-'],
          ['<', '<=', '>', '>='],
          ['==', '!='],
          ['&&'],
          ['||', '??'],
        ],
        operatorsPrefix: ['!', 'n'],
        literals: { '"': '"', '`': '`', "'": "'", '[': ']' },
        numberRx: /^(?:[0-9]*\.?[0-9]*){1}$/,
        tokenRx: /^[\w\$\#\.\@\:\{\}]+$/,
        symbol: Symbol('formula'),
        settings: Symbol('settings'),
      }
      t.Parser = class {
        constructor(e, t = {}) {
          if (!t[r.settings] && t.constants) {
            for (const e in t.constants) {
              const r = t.constants[e]
              if (
                r !== null &&
                !['boolean', 'number', 'string'].includes(typeof r)
              ) {
                throw new Error(
                  `Formula constant ${e} contains invalid ${typeof r} value type`
                )
              }
            }
          }
          this.settings = t[r.settings]
            ? t
            : Object.assign(
                { [r.settings]: true, constants: {}, functions: {} },
                t
              )
          this.single = null
          this._parts = null
          this._parse(e)
        }
        _parse(e) {
          let n = []
          let s = ''
          let i = 0
          let o = false
          const flush = (e) => {
            if (i) {
              throw new Error('Formula missing closing parenthesis')
            }
            const a = n.length ? n[n.length - 1] : null
            if (!o && !s && !e) {
              return
            }
            if (a && a.type === 'reference' && e === ')') {
              a.type = 'function'
              a.value = this._subFormula(s, a.value)
              s = ''
              return
            }
            if (e === ')') {
              const e = new t.Parser(s, this.settings)
              n.push({ type: 'segment', value: e })
            } else if (o) {
              if (o === ']') {
                n.push({ type: 'reference', value: s })
                s = ''
                return
              }
              n.push({ type: 'literal', value: s })
            } else if (r.operatorCharacters.includes(s)) {
              if (
                a &&
                a.type === 'operator' &&
                r.operators.includes(a.value + s)
              ) {
                a.value += s
              } else {
                n.push({ type: 'operator', value: s })
              }
            } else if (s.match(r.numberRx)) {
              n.push({ type: 'constant', value: parseFloat(s) })
            } else if (this.settings.constants[s] !== undefined) {
              n.push({ type: 'constant', value: this.settings.constants[s] })
            } else {
              if (!s.match(r.tokenRx)) {
                throw new Error(`Formula contains invalid token: ${s}`)
              }
              n.push({ type: 'reference', value: s })
            }
            s = ''
          }
          for (const t of e) {
            if (o) {
              if (t === o) {
                flush()
                o = false
              } else {
                s += t
              }
            } else if (i) {
              if (t === '(') {
                s += t
                ++i
              } else if (t === ')') {
                --i
                if (!i) {
                  flush(t)
                } else {
                  s += t
                }
              } else {
                s += t
              }
            } else if (t in r.literals) {
              o = r.literals[t]
            } else if (t === '(') {
              flush()
              ++i
            } else if (r.operatorCharacters.includes(t)) {
              flush()
              s = t
              flush()
            } else if (t !== ' ') {
              s += t
            } else {
              flush()
            }
          }
          flush()
          n = n.map((e, t) => {
            if (
              e.type !== 'operator' ||
              e.value !== '-' ||
              (t && n[t - 1].type !== 'operator')
            ) {
              return e
            }
            return { type: 'operator', value: 'n' }
          })
          let a = false
          for (const e of n) {
            if (e.type === 'operator') {
              if (r.operatorsPrefix.includes(e.value)) {
                continue
              }
              if (!a) {
                throw new Error(
                  'Formula contains an operator in invalid position'
                )
              }
              if (!r.operators.includes(e.value)) {
                throw new Error(
                  `Formula contains an unknown operator ${e.value}`
                )
              }
            } else if (a) {
              throw new Error('Formula missing expected operator')
            }
            a = !a
          }
          if (!a) {
            throw new Error('Formula contains invalid trailing operator')
          }
          if (
            n.length === 1 &&
            ['reference', 'literal', 'constant'].includes(n[0].type)
          ) {
            this.single = {
              type: n[0].type === 'reference' ? 'reference' : 'value',
              value: n[0].value,
            }
          }
          this._parts = n.map((e) => {
            if (e.type === 'operator') {
              return r.operatorsPrefix.includes(e.value) ? e : e.value
            }
            if (e.type !== 'reference') {
              return e.value
            }
            if (this.settings.tokenRx && !this.settings.tokenRx.test(e.value)) {
              throw new Error(`Formula contains invalid reference ${e.value}`)
            }
            if (this.settings.reference) {
              return this.settings.reference(e.value)
            }
            return r.reference(e.value)
          })
        }
        _subFormula(e, n) {
          const s = this.settings.functions[n]
          if (typeof s !== 'function') {
            throw new Error(`Formula contains unknown function ${n}`)
          }
          let i = []
          if (e) {
            let t = ''
            let s = 0
            let o = false
            const flush = () => {
              if (!t) {
                throw new Error(
                  `Formula contains function ${n} with invalid arguments ${e}`
                )
              }
              i.push(t)
              t = ''
            }
            for (let n = 0; n < e.length; ++n) {
              const i = e[n]
              if (o) {
                t += i
                if (i === o) {
                  o = false
                }
              } else if (i in r.literals && !s) {
                t += i
                o = r.literals[i]
              } else if (i === ',' && !s) {
                flush()
              } else {
                t += i
                if (i === '(') {
                  ++s
                } else if (i === ')') {
                  --s
                }
              }
            }
            flush()
          }
          i = i.map((e) => new t.Parser(e, this.settings))
          return function (e) {
            const t = []
            for (const r of i) {
              t.push(r.evaluate(e))
            }
            return s.call(e, ...t)
          }
        }
        evaluate(e) {
          const t = this._parts.slice()
          for (let n = t.length - 2; n >= 0; --n) {
            const s = t[n]
            if (s && s.type === 'operator') {
              const i = t[n + 1]
              t.splice(n + 1, 1)
              const o = r.evaluate(i, e)
              t[n] = r.single(s.value, o)
            }
          }
          r.operatorsOrder.forEach((n) => {
            for (let s = 1; s < t.length - 1; ) {
              if (n.includes(t[s])) {
                const n = t[s]
                const i = r.evaluate(t[s - 1], e)
                const o = r.evaluate(t[s + 1], e)
                t.splice(s, 2)
                const a = r.calculate(n, i, o)
                t[s - 1] = a === 0 ? 0 : a
              } else {
                s += 2
              }
            }
          })
          return r.evaluate(t[0], e)
        }
      }
      t.Parser.prototype[r.symbol] = true
      r.reference = function (e) {
        return function (t) {
          return t && t[e] !== undefined ? t[e] : null
        }
      }
      r.evaluate = function (e, t) {
        if (e === null) {
          return null
        }
        if (typeof e === 'function') {
          return e(t)
        }
        if (e[r.symbol]) {
          return e.evaluate(t)
        }
        return e
      }
      r.single = function (e, t) {
        if (e === '!') {
          return t ? false : true
        }
        const r = -t
        if (r === 0) {
          return 0
        }
        return r
      }
      r.calculate = function (e, t, n) {
        if (e === '??') {
          return r.exists(t) ? t : n
        }
        if (typeof t === 'string' || typeof n === 'string') {
          if (e === '+') {
            t = r.exists(t) ? t : ''
            n = r.exists(n) ? n : ''
            return t + n
          }
        } else {
          switch (e) {
            case '^':
              return Math.pow(t, n)
            case '*':
              return t * n
            case '/':
              return t / n
            case '%':
              return t % n
            case '+':
              return t + n
            case '-':
              return t - n
          }
        }
        switch (e) {
          case '<':
            return t < n
          case '<=':
            return t <= n
          case '>':
            return t > n
          case '>=':
            return t >= n
          case '==':
            return t === n
          case '!=':
            return t !== n
          case '&&':
            return t && n
          case '||':
            return t || n
        }
        return null
      }
      r.exists = function (e) {
        return e !== null && e !== undefined
      }
    },
    9937: function (e, t, r) {
      const n = r(8309)
      const s = r(546)
      const i = r(434)
      const o = r(6070)
      const a = {}
      e.exports = function (e, t, r = {}) {
        n(
          e && typeof e === 'object',
          'Invalid defaults value: must be an object'
        )
        n(
          !t || t === true || typeof t === 'object',
          'Invalid source value: must be true, falsy or an object'
        )
        n(typeof r === 'object', 'Invalid options: must be an object')
        if (!t) {
          return null
        }
        if (r.shallow) {
          return a.applyToDefaultsWithShallow(e, t, r)
        }
        const o = s(e)
        if (t === true) {
          return o
        }
        const l = r.nullOverride !== undefined ? r.nullOverride : false
        return i(o, t, { nullOverride: l, mergeArrays: false })
      }
      a.applyToDefaultsWithShallow = function (e, t, r) {
        const l = r.shallow
        n(Array.isArray(l), 'Invalid keys')
        const c = new Map()
        const u = t === true ? null : new Set()
        for (let r of l) {
          r = Array.isArray(r) ? r : r.split('.')
          const n = o(e, r)
          if (n && typeof n === 'object') {
            c.set(n, (u && o(t, r)) || n)
          } else if (u) {
            u.add(r)
          }
        }
        const f = s(e, {}, c)
        if (!u) {
          return f
        }
        for (const e of u) {
          a.reachCopy(f, t, e)
        }
        const d = r.nullOverride !== undefined ? r.nullOverride : false
        return i(f, t, { nullOverride: d, mergeArrays: false })
      }
      a.reachCopy = function (e, t, r) {
        for (const e of r) {
          if (!(e in t)) {
            return
          }
          const r = t[e]
          if (typeof r !== 'object' || r === null) {
            return
          }
          t = r
        }
        const n = t
        let s = e
        for (let e = 0; e < r.length - 1; ++e) {
          const t = r[e]
          if (typeof s[t] !== 'object') {
            s[t] = {}
          }
          s = s[t]
        }
        s[r[r.length - 1]] = n
      }
    },
    8309: function (e, t, r) {
      const n = r(7534)
      const s = {}
      e.exports = function (e, ...t) {
        if (e) {
          return
        }
        if (t.length === 1 && t[0] instanceof Error) {
          throw t[0]
        }
        throw new n(t)
      }
    },
    546: function (e, t, r) {
      const n = r(6070)
      const s = r(5016)
      const i = r(4337)
      const o = {
        needsProtoHack: new Set([s.set, s.map, s.weakSet, s.weakMap]),
      }
      e.exports = o.clone = function (e, t = {}, r = null) {
        if (typeof e !== 'object' || e === null) {
          return e
        }
        let n = o.clone
        let a = r
        if (t.shallow) {
          if (t.shallow !== true) {
            return o.cloneWithShallow(e, t)
          }
          n = (e) => e
        } else if (a) {
          const t = a.get(e)
          if (t) {
            return t
          }
        } else {
          a = new Map()
        }
        const l = s.getInternalProto(e)
        if (l === s.buffer) {
          return Buffer && Buffer.from(e)
        }
        if (l === s.date) {
          return new Date(e.getTime())
        }
        if (l === s.regex) {
          return new RegExp(e)
        }
        const c = o.base(e, l, t)
        if (c === e) {
          return e
        }
        if (a) {
          a.set(e, c)
        }
        if (l === s.set) {
          for (const r of e) {
            c.add(n(r, t, a))
          }
        } else if (l === s.map) {
          for (const [r, s] of e) {
            c.set(r, n(s, t, a))
          }
        }
        const u = i.keys(e, t)
        for (const r of u) {
          if (r === '__proto__') {
            continue
          }
          if (l === s.array && r === 'length') {
            c.length = e.length
            continue
          }
          const i = Object.getOwnPropertyDescriptor(e, r)
          if (i) {
            if (i.get || i.set) {
              Object.defineProperty(c, r, i)
            } else if (i.enumerable) {
              c[r] = n(e[r], t, a)
            } else {
              Object.defineProperty(c, r, {
                enumerable: false,
                writable: true,
                configurable: true,
                value: n(e[r], t, a),
              })
            }
          } else {
            Object.defineProperty(c, r, {
              enumerable: true,
              writable: true,
              configurable: true,
              value: n(e[r], t, a),
            })
          }
        }
        return c
      }
      o.cloneWithShallow = function (e, t) {
        const r = t.shallow
        t = Object.assign({}, t)
        t.shallow = false
        const s = new Map()
        for (const t of r) {
          const r = n(e, t)
          if (typeof r === 'object' || typeof r === 'function') {
            s.set(r, r)
          }
        }
        return o.clone(e, t, s)
      }
      o.base = function (e, t, r) {
        if (r.prototype === false) {
          if (o.needsProtoHack.has(t)) {
            return new t.constructor()
          }
          return t === s.array ? [] : {}
        }
        const n = Object.getPrototypeOf(e)
        if (n && n.isImmutable) {
          return e
        }
        if (t === s.array) {
          const e = []
          if (n !== t) {
            Object.setPrototypeOf(e, n)
          }
          return e
        }
        if (o.needsProtoHack.has(t)) {
          const e = new n.constructor()
          if (n !== t) {
            Object.setPrototypeOf(e, n)
          }
          return e
        }
        return Object.create(n)
      }
    },
    8130: function (e, t, r) {
      const n = r(5016)
      const s = { mismatched: null }
      e.exports = function (e, t, r) {
        r = Object.assign({ prototype: true }, r)
        return !!s.isDeepEqual(e, t, r, [])
      }
      s.isDeepEqual = function (e, t, r, i) {
        if (e === t) {
          return e !== 0 || 1 / e === 1 / t
        }
        const o = typeof e
        if (o !== typeof t) {
          return false
        }
        if (e === null || t === null) {
          return false
        }
        if (o === 'function') {
          if (!r.deepFunction || e.toString() !== t.toString()) {
            return false
          }
        } else if (o !== 'object') {
          return e !== e && t !== t
        }
        const a = s.getSharedType(e, t, !!r.prototype)
        switch (a) {
          case n.buffer:
            return Buffer && Buffer.prototype.equals.call(e, t)
          case n.promise:
            return e === t
          case n.regex:
            return e.toString() === t.toString()
          case s.mismatched:
            return false
        }
        for (let r = i.length - 1; r >= 0; --r) {
          if (i[r].isSame(e, t)) {
            return true
          }
        }
        i.push(new s.SeenEntry(e, t))
        try {
          return !!s.isDeepEqualObj(a, e, t, r, i)
        } finally {
          i.pop()
        }
      }
      s.getSharedType = function (e, t, r) {
        if (r) {
          if (Object.getPrototypeOf(e) !== Object.getPrototypeOf(t)) {
            return s.mismatched
          }
          return n.getInternalProto(e)
        }
        const i = n.getInternalProto(e)
        if (i !== n.getInternalProto(t)) {
          return s.mismatched
        }
        return i
      }
      s.valueOf = function (e) {
        const t = e.valueOf
        if (t === undefined) {
          return e
        }
        try {
          return t.call(e)
        } catch (e) {
          return e
        }
      }
      s.hasOwnEnumerableProperty = function (e, t) {
        return Object.prototype.propertyIsEnumerable.call(e, t)
      }
      s.isSetSimpleEqual = function (e, t) {
        for (const r of Set.prototype.values.call(e)) {
          if (!Set.prototype.has.call(t, r)) {
            return false
          }
        }
        return true
      }
      s.isDeepEqualObj = function (e, t, r, i, o) {
        const { isDeepEqual: a, valueOf: l, hasOwnEnumerableProperty: c } = s
        const { keys: u, getOwnPropertySymbols: f } = Object
        if (e === n.array) {
          if (i.part) {
            for (const e of t) {
              for (const t of r) {
                if (a(e, t, i, o)) {
                  return true
                }
              }
            }
          } else {
            if (t.length !== r.length) {
              return false
            }
            for (let e = 0; e < t.length; ++e) {
              if (!a(t[e], r[e], i, o)) {
                return false
              }
            }
            return true
          }
        } else if (e === n.set) {
          if (t.size !== r.size) {
            return false
          }
          if (!s.isSetSimpleEqual(t, r)) {
            const e = new Set(Set.prototype.values.call(r))
            for (const r of Set.prototype.values.call(t)) {
              if (e.delete(r)) {
                continue
              }
              let t = false
              for (const n of e) {
                if (a(r, n, i, o)) {
                  e.delete(n)
                  t = true
                  break
                }
              }
              if (!t) {
                return false
              }
            }
          }
        } else if (e === n.map) {
          if (t.size !== r.size) {
            return false
          }
          for (const [e, n] of Map.prototype.entries.call(t)) {
            if (n === undefined && !Map.prototype.has.call(r, e)) {
              return false
            }
            if (!a(n, Map.prototype.get.call(r, e), i, o)) {
              return false
            }
          }
        } else if (e === n.error) {
          if (t.name !== r.name || t.message !== r.message) {
            return false
          }
        }
        const d = l(t)
        const m = l(r)
        if ((t !== d || r !== m) && !a(d, m, i, o)) {
          return false
        }
        const h = u(t)
        if (!i.part && h.length !== u(r).length && !i.skip) {
          return false
        }
        let p = 0
        for (const e of h) {
          if (i.skip && i.skip.includes(e)) {
            if (r[e] === undefined) {
              ++p
            }
            continue
          }
          if (!c(r, e)) {
            return false
          }
          if (!a(t[e], r[e], i, o)) {
            return false
          }
        }
        if (!i.part && h.length - p !== u(r).length) {
          return false
        }
        if (i.symbols !== false) {
          const e = f(t)
          const n = new Set(f(r))
          for (const s of e) {
            if (!i.skip || !i.skip.includes(s)) {
              if (c(t, s)) {
                if (!c(r, s)) {
                  return false
                }
                if (!a(t[s], r[s], i, o)) {
                  return false
                }
              } else if (c(r, s)) {
                return false
              }
            }
            n.delete(s)
          }
          for (const e of n) {
            if (c(r, e)) {
              return false
            }
          }
        }
        return true
      }
      s.SeenEntry = class {
        constructor(e, t) {
          this.obj = e
          this.ref = t
        }
        isSame(e, t) {
          return this.obj === e && this.ref === t
        }
      }
    },
    7534: function (e, t, r) {
      const n = r(3072)
      const s = {}
      e.exports = class extends Error {
        constructor(e) {
          const r = e
            .filter((e) => e !== '')
            .map((e) =>
              typeof e === 'string' ? e : e instanceof Error ? e.message : n(e)
            )
          super(r.join(' ') || 'Unknown error')
          if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, t.assert)
          }
        }
      }
    },
    6339: function (e) {
      const t = {}
      e.exports = function (e) {
        if (!e) {
          return ''
        }
        let r = ''
        for (let n = 0; n < e.length; ++n) {
          const s = e.charCodeAt(n)
          if (t.isSafe(s)) {
            r += e[n]
          } else {
            r += t.escapeHtmlChar(s)
          }
        }
        return r
      }
      t.escapeHtmlChar = function (e) {
        const r = t.namedHtml.get(e)
        if (r) {
          return r
        }
        if (e >= 256) {
          return '&#' + e + ';'
        }
        const n = e.toString(16).padStart(2, '0')
        return `&#x${n};`
      }
      t.isSafe = function (e) {
        return t.safeCharCodes.has(e)
      }
      t.namedHtml = new Map([
        [38, '&amp;'],
        [60, '&lt;'],
        [62, '&gt;'],
        [34, '&quot;'],
        [160, '&nbsp;'],
        [162, '&cent;'],
        [163, '&pound;'],
        [164, '&curren;'],
        [169, '&copy;'],
        [174, '&reg;'],
      ])
      t.safeCharCodes = (function () {
        const e = new Set()
        for (let t = 32; t < 123; ++t) {
          if (
            t >= 97 ||
            (t >= 65 && t <= 90) ||
            (t >= 48 && t <= 57) ||
            t === 32 ||
            t === 46 ||
            t === 44 ||
            t === 45 ||
            t === 58 ||
            t === 95
          ) {
            e.add(t)
          }
        }
        return e
      })()
    },
    9141: function (e) {
      const t = {}
      e.exports = function (e) {
        return e.replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, '\\$&')
      }
    },
    9309: function (e) {
      const t = {}
      e.exports = function () {}
    },
    434: function (e, t, r) {
      const n = r(8309)
      const s = r(546)
      const i = r(4337)
      const o = {}
      e.exports = o.merge = function (e, t, r) {
        n(e && typeof e === 'object', 'Invalid target value: must be an object')
        n(
          t === null || t === undefined || typeof t === 'object',
          'Invalid source value: must be null, undefined, or an object'
        )
        if (!t) {
          return e
        }
        r = Object.assign({ nullOverride: true, mergeArrays: true }, r)
        if (Array.isArray(t)) {
          n(Array.isArray(e), 'Cannot merge array onto an object')
          if (!r.mergeArrays) {
            e.length = 0
          }
          for (let n = 0; n < t.length; ++n) {
            e.push(s(t[n], { symbols: r.symbols }))
          }
          return e
        }
        const a = i.keys(t, r)
        for (let n = 0; n < a.length; ++n) {
          const i = a[n]
          if (
            i === '__proto__' ||
            !Object.prototype.propertyIsEnumerable.call(t, i)
          ) {
            continue
          }
          const l = t[i]
          if (l && typeof l === 'object') {
            if (e[i] === l) {
              continue
            }
            if (
              !e[i] ||
              typeof e[i] !== 'object' ||
              Array.isArray(e[i]) !== Array.isArray(l) ||
              l instanceof Date ||
              (Buffer && Buffer.isBuffer(l)) ||
              l instanceof RegExp
            ) {
              e[i] = s(l, { symbols: r.symbols })
            } else {
              o.merge(e[i], l, r)
            }
          } else {
            if (l !== null && l !== undefined) {
              e[i] = l
            } else if (r.nullOverride) {
              e[i] = l
            }
          }
        }
        return e
      }
    },
    6070: function (e, t, r) {
      const n = r(8309)
      const s = {}
      e.exports = function (e, t, r) {
        if (t === false || t === null || t === undefined) {
          return e
        }
        r = r || {}
        if (typeof r === 'string') {
          r = { separator: r }
        }
        const i = Array.isArray(t)
        n(
          !i || !r.separator,
          'Separator option is not valid for array-based chain'
        )
        const o = i ? t : t.split(r.separator || '.')
        let a = e
        for (let e = 0; e < o.length; ++e) {
          let i = o[e]
          const l = r.iterables && s.iterables(a)
          if (Array.isArray(a) || l === 'set') {
            const e = Number(i)
            if (Number.isInteger(e)) {
              i = e < 0 ? a.length + e : e
            }
          }
          if (
            !a ||
            (typeof a === 'function' && r.functions === false) ||
            (!l && a[i] === undefined)
          ) {
            n(
              !r.strict || e + 1 === o.length,
              'Missing segment',
              i,
              'in reach path ',
              t
            )
            n(
              typeof a === 'object' ||
                r.functions === true ||
                typeof a !== 'function',
              'Invalid segment',
              i,
              'in reach path ',
              t
            )
            a = r.default
            break
          }
          if (!l) {
            a = a[i]
          } else if (l === 'set') {
            a = [...a][i]
          } else {
            a = a.get(i)
          }
        }
        return a
      }
      s.iterables = function (e) {
        if (e instanceof Set) {
          return 'set'
        }
        if (e instanceof Map) {
          return 'map'
        }
      }
    },
    3072: function (e) {
      const t = {}
      e.exports = function (...e) {
        try {
          return JSON.stringify(...e)
        } catch (e) {
          return '[Cannot display object: ' + e.message + ']'
        }
      }
    },
    5016: function (e, t) {
      const r = {}
      t = e.exports = {
        array: Array.prototype,
        buffer: Buffer && Buffer.prototype,
        date: Date.prototype,
        error: Error.prototype,
        generic: Object.prototype,
        map: Map.prototype,
        promise: Promise.prototype,
        regex: RegExp.prototype,
        set: Set.prototype,
        weakMap: WeakMap.prototype,
        weakSet: WeakSet.prototype,
      }
      r.typeMap = new Map([
        ['[object Error]', t.error],
        ['[object Map]', t.map],
        ['[object Promise]', t.promise],
        ['[object Set]', t.set],
        ['[object WeakMap]', t.weakMap],
        ['[object WeakSet]', t.weakSet],
      ])
      t.getInternalProto = function (e) {
        if (Array.isArray(e)) {
          return t.array
        }
        if (Buffer && e instanceof Buffer) {
          return t.buffer
        }
        if (e instanceof Date) {
          return t.date
        }
        if (e instanceof RegExp) {
          return t.regex
        }
        if (e instanceof Error) {
          return t.error
        }
        const n = Object.prototype.toString.call(e)
        return r.typeMap.get(n) || t.generic
      }
    },
    4337: function (e, t) {
      const r = {}
      t.keys = function (e, t = {}) {
        return t.symbols !== false
          ? Reflect.ownKeys(e)
          : Object.getOwnPropertyNames(e)
      }
    },
    5483: function (e, t, r) {
      const n = r(546)
      const s = r(7614)
      const i = { annotations: Symbol('annotations') }
      t.error = function (e) {
        if (!this._original || typeof this._original !== 'object') {
          return this.details[0].message
        }
        const t = e ? '' : '[31m'
        const r = e ? '' : '[41m'
        const o = e ? '' : '[0m'
        const a = n(this._original)
        for (let e = this.details.length - 1; e >= 0; --e) {
          const t = e + 1
          const r = this.details[e]
          const n = r.path
          let o = a
          for (let e = 0; ; ++e) {
            const a = n[e]
            if (s.isSchema(o)) {
              o = o.clone()
            }
            if (e + 1 < n.length && typeof o[a] !== 'string') {
              o = o[a]
            } else {
              const e = o[i.annotations] || { errors: {}, missing: {} }
              o[i.annotations] = e
              const n = a || r.context.key
              if (o[a] !== undefined) {
                e.errors[n] = e.errors[n] || []
                e.errors[n].push(t)
              } else {
                e.missing[n] = t
              }
              break
            }
          }
        }
        const l = {
          key: /_\$key\$_([, \d]+)_\$end\$_"/g,
          missing: /"_\$miss\$_([^|]+)\|(\d+)_\$end\$_": "__missing__"/g,
          arrayIndex: /\s*"_\$idx\$_([, \d]+)_\$end\$_",?\n(.*)/g,
          specials: /"\[(NaN|Symbol.*|-?Infinity|function.*|\(.*)]"/g,
        }
        let c = i
          .safeStringify(a, 2)
          .replace(l.key, (e, r) => `" ${t}[${r}]${o}`)
          .replace(
            l.missing,
            (e, n, s) => `${r}"${n}"${o}${t} [${s}]: -- missing --${o}`
          )
          .replace(l.arrayIndex, (e, r, n) => `\n${n} ${t}[${r}]${o}`)
          .replace(l.specials, (e, t) => t)
        c = `${c}\n${t}`
        for (let e = 0; e < this.details.length; ++e) {
          const t = e + 1
          c = `${c}\n[${t}] ${this.details[e].message}`
        }
        c = c + o
        return c
      }
      i.safeStringify = function (e, t) {
        return JSON.stringify(e, i.serializer(), t)
      }
      i.serializer = function () {
        const e = []
        const t = []
        const cycleReplacer = (r, n) => {
          if (t[0] === n) {
            return '[Circular ~]'
          }
          return '[Circular ~.' + e.slice(0, t.indexOf(n)).join('.') + ']'
        }
        return function (r, n) {
          if (t.length > 0) {
            const s = t.indexOf(this)
            if (~s) {
              t.length = s + 1
              e.length = s + 1
              e[s] = r
            } else {
              t.push(this)
              e.push(r)
            }
            if (~t.indexOf(n)) {
              n = cycleReplacer.call(this, r, n)
            }
          } else {
            t.push(n)
          }
          if (n) {
            const e = n[i.annotations]
            if (e) {
              if (Array.isArray(n)) {
                const t = []
                for (let r = 0; r < n.length; ++r) {
                  if (e.errors[r]) {
                    t.push(`_$idx$_${e.errors[r].sort().join(', ')}_$end$_`)
                  }
                  t.push(n[r])
                }
                n = t
              } else {
                for (const t in e.errors) {
                  n[`${t}_$key$_${e.errors[t].sort().join(', ')}_$end$_`] = n[t]
                  n[t] = undefined
                }
                for (const t in e.missing) {
                  n[`_$miss$_${t}|${e.missing[t]}_$end$_`] = '__missing__'
                }
              }
              return n
            }
          }
          if (
            n === Infinity ||
            n === -Infinity ||
            Number.isNaN(n) ||
            typeof n === 'function' ||
            typeof n === 'symbol'
          ) {
            return '[' + n.toString() + ']'
          }
          return n
        }
      }
    },
    5530: function (e, t, r) {
      const n = r(8309)
      const s = r(546)
      const i = r(8130)
      const o = r(434)
      const a = r(9178)
      const l = r(7614)
      const c = r(1039)
      const u = r(3377)
      const f = r(1897)
      const d = r(2785)
      const m = r(7889)
      const h = r(835)
      const p = r(5039)
      const g = r(1943)
      const y = r(2978)
      const b = r(3054)
      const _ = {}
      _.Base = class {
        constructor(e) {
          this.type = e
          this.$_root = null
          this._definition = {}
          this._ids = new h.Ids()
          this._preferences = null
          this._refs = new p.Manager()
          this._cache = null
          this._valids = null
          this._invalids = null
          this._flags = {}
          this._rules = []
          this._singleRules = new Map()
          this.$_terms = {}
          this.$_temp = { ruleset: null, whens: {} }
        }
        describe() {
          n(typeof d.describe === 'function', 'Manifest functionality disabled')
          return d.describe(this)
        }
        allow(...e) {
          l.verifyFlat(e, 'allow')
          return this._values(e, '_valids')
        }
        alter(e) {
          n(
            e && typeof e === 'object' && !Array.isArray(e),
            'Invalid targets argument'
          )
          n(!this._inRuleset(), 'Cannot set alterations inside a ruleset')
          const t = this.clone()
          t.$_terms.alterations = t.$_terms.alterations || []
          for (const r in e) {
            const s = e[r]
            n(
              typeof s === 'function',
              'Alteration adjuster for',
              r,
              'must be a function'
            )
            t.$_terms.alterations.push({ target: r, adjuster: s })
          }
          t.$_temp.ruleset = false
          return t
        }
        cast(e) {
          n(e === false || typeof e === 'string', 'Invalid to value')
          n(
            e === false || this._definition.cast[e],
            'Type',
            this.type,
            'does not support casting to',
            e
          )
          return this.$_setFlag('cast', e === false ? undefined : e)
        }
        default(e, t) {
          return this._default('default', e, t)
        }
        description(e) {
          n(
            e && typeof e === 'string',
            'Description must be a non-empty string'
          )
          return this.$_setFlag('description', e)
        }
        empty(e) {
          const t = this.clone()
          if (e !== undefined) {
            e = t.$_compile(e, { override: false })
          }
          return t.$_setFlag('empty', e, { clone: false })
        }
        error(e) {
          n(e, 'Missing error')
          n(
            e instanceof Error || typeof e === 'function',
            'Must provide a valid Error object or a function'
          )
          return this.$_setFlag('error', e)
        }
        example(e, t = {}) {
          n(e !== undefined, 'Missing example')
          l.assertOptions(t, ['override'])
          return this._inner('examples', e, {
            single: true,
            override: t.override,
          })
        }
        external(e, t) {
          if (typeof e === 'object') {
            n(!t, 'Cannot combine options with description')
            t = e.description
            e = e.method
          }
          n(typeof e === 'function', 'Method must be a function')
          n(
            t === undefined || (t && typeof t === 'string'),
            'Description must be a non-empty string'
          )
          return this._inner(
            'externals',
            { method: e, description: t },
            { single: true }
          )
        }
        failover(e, t) {
          return this._default('failover', e, t)
        }
        forbidden() {
          return this.presence('forbidden')
        }
        id(e) {
          if (!e) {
            return this.$_setFlag('id', undefined)
          }
          n(typeof e === 'string', 'id must be a non-empty string')
          n(/^[^\.]+$/.test(e), 'id cannot contain period character')
          return this.$_setFlag('id', e)
        }
        invalid(...e) {
          return this._values(e, '_invalids')
        }
        label(e) {
          n(e && typeof e === 'string', 'Label name must be a non-empty string')
          return this.$_setFlag('label', e)
        }
        meta(e) {
          n(e !== undefined, 'Meta cannot be undefined')
          return this._inner('metas', e, { single: true })
        }
        note(...e) {
          n(e.length, 'Missing notes')
          for (const t of e) {
            n(t && typeof t === 'string', 'Notes must be non-empty strings')
          }
          return this._inner('notes', e)
        }
        only(e = true) {
          n(typeof e === 'boolean', 'Invalid mode:', e)
          return this.$_setFlag('only', e)
        }
        optional() {
          return this.presence('optional')
        }
        prefs(e) {
          n(e, 'Missing preferences')
          n(e.context === undefined, 'Cannot override context')
          n(e.externals === undefined, 'Cannot override externals')
          n(e.warnings === undefined, 'Cannot override warnings')
          n(e.debug === undefined, 'Cannot override debug')
          l.checkPreferences(e)
          const t = this.clone()
          t._preferences = l.preferences(t._preferences, e)
          return t
        }
        presence(e) {
          n(
            ['optional', 'required', 'forbidden'].includes(e),
            'Unknown presence mode',
            e
          )
          return this.$_setFlag('presence', e)
        }
        raw(e = true) {
          return this.$_setFlag('result', e ? 'raw' : undefined)
        }
        result(e) {
          n(['raw', 'strip'].includes(e), 'Unknown result mode', e)
          return this.$_setFlag('result', e)
        }
        required() {
          return this.presence('required')
        }
        strict(e) {
          const t = this.clone()
          const r = e === undefined ? false : !e
          t._preferences = l.preferences(t._preferences, { convert: r })
          return t
        }
        strip(e = true) {
          return this.$_setFlag('result', e ? 'strip' : undefined)
        }
        tag(...e) {
          n(e.length, 'Missing tags')
          for (const t of e) {
            n(t && typeof t === 'string', 'Tags must be non-empty strings')
          }
          return this._inner('tags', e)
        }
        unit(e) {
          n(e && typeof e === 'string', 'Unit name must be a non-empty string')
          return this.$_setFlag('unit', e)
        }
        valid(...e) {
          l.verifyFlat(e, 'valid')
          const t = this.allow(...e)
          t.$_setFlag('only', !!t._valids, { clone: false })
          return t
        }
        when(e, t) {
          const r = this.clone()
          if (!r.$_terms.whens) {
            r.$_terms.whens = []
          }
          const s = c.when(r, e, t)
          if (!['any', 'link'].includes(r.type)) {
            const e = s.is ? [s] : s.switch
            for (const t of e) {
              n(
                !t.then || t.then.type === 'any' || t.then.type === r.type,
                'Cannot combine',
                r.type,
                'with',
                t.then && t.then.type
              )
              n(
                !t.otherwise ||
                  t.otherwise.type === 'any' ||
                  t.otherwise.type === r.type,
                'Cannot combine',
                r.type,
                'with',
                t.otherwise && t.otherwise.type
              )
            }
          }
          r.$_terms.whens.push(s)
          return r.$_mutateRebuild()
        }
        cache(e) {
          n(!this._inRuleset(), 'Cannot set caching inside a ruleset')
          n(!this._cache, 'Cannot override schema cache')
          const t = this.clone()
          t._cache = e || a.provider.provision()
          t.$_temp.ruleset = false
          return t
        }
        clone() {
          const e = Object.create(Object.getPrototypeOf(this))
          return this._assign(e)
        }
        concat(e) {
          n(l.isSchema(e), 'Invalid schema object')
          n(
            this.type === 'any' || e.type === 'any' || e.type === this.type,
            'Cannot merge type',
            this.type,
            'with another type:',
            e.type
          )
          n(
            !this._inRuleset(),
            'Cannot concatenate onto a schema with open ruleset'
          )
          n(!e._inRuleset(), 'Cannot concatenate a schema with open ruleset')
          let t = this.clone()
          if (this.type === 'any' && e.type !== 'any') {
            const r = e.clone()
            for (const e of Object.keys(t)) {
              if (e !== 'type') {
                r[e] = t[e]
              }
            }
            t = r
          }
          t._ids.concat(e._ids)
          t._refs.register(e, p.toSibling)
          t._preferences = t._preferences
            ? l.preferences(t._preferences, e._preferences)
            : e._preferences
          t._valids = b.merge(t._valids, e._valids, e._invalids)
          t._invalids = b.merge(t._invalids, e._invalids, e._valids)
          for (const r of e._singleRules.keys()) {
            if (t._singleRules.has(r)) {
              t._rules = t._rules.filter((e) => e.keep || e.name !== r)
              t._singleRules.delete(r)
            }
          }
          for (const r of e._rules) {
            if (!e._definition.rules[r.method].multi) {
              t._singleRules.set(r.name, r)
            }
            t._rules.push(r)
          }
          if (t._flags.empty && e._flags.empty) {
            t._flags.empty = t._flags.empty.concat(e._flags.empty)
            const r = Object.assign({}, e._flags)
            delete r.empty
            o(t._flags, r)
          } else if (e._flags.empty) {
            t._flags.empty = e._flags.empty
            const r = Object.assign({}, e._flags)
            delete r.empty
            o(t._flags, r)
          } else {
            o(t._flags, e._flags)
          }
          for (const r in e.$_terms) {
            const n = e.$_terms[r]
            if (!n) {
              if (!t.$_terms[r]) {
                t.$_terms[r] = n
              }
              continue
            }
            if (!t.$_terms[r]) {
              t.$_terms[r] = n.slice()
              continue
            }
            t.$_terms[r] = t.$_terms[r].concat(n)
          }
          if (this.$_root._tracer) {
            this.$_root._tracer._combine(t, [this, e])
          }
          return t.$_mutateRebuild()
        }
        extend(e) {
          n(!e.base, 'Cannot extend type with another base')
          return f.type(this, e)
        }
        extract(e) {
          e = Array.isArray(e) ? e : e.split('.')
          return this._ids.reach(e)
        }
        fork(e, t) {
          n(!this._inRuleset(), 'Cannot fork inside a ruleset')
          let r = this
          for (let n of [].concat(e)) {
            n = Array.isArray(n) ? n : n.split('.')
            r = r._ids.fork(n, t, r)
          }
          r.$_temp.ruleset = false
          return r
        }
        rule(e) {
          const t = this._definition
          l.assertOptions(e, Object.keys(t.modifiers))
          n(
            this.$_temp.ruleset !== false,
            'Cannot apply rules to empty ruleset or the last rule added does not support rule properties'
          )
          const r =
            this.$_temp.ruleset === null
              ? this._rules.length - 1
              : this.$_temp.ruleset
          n(
            r >= 0 && r < this._rules.length,
            'Cannot apply rules to empty ruleset'
          )
          const i = this.clone()
          for (let o = r; o < i._rules.length; ++o) {
            const r = i._rules[o]
            const a = s(r)
            for (const s in e) {
              t.modifiers[s](a, e[s])
              n(a.name === r.name, 'Cannot change rule name')
            }
            i._rules[o] = a
            if (i._singleRules.get(a.name) === r) {
              i._singleRules.set(a.name, a)
            }
          }
          i.$_temp.ruleset = false
          return i.$_mutateRebuild()
        }
        get ruleset() {
          n(
            !this._inRuleset(),
            'Cannot start a new ruleset without closing the previous one'
          )
          const e = this.clone()
          e.$_temp.ruleset = e._rules.length
          return e
        }
        get $() {
          return this.ruleset
        }
        tailor(e) {
          e = [].concat(e)
          n(!this._inRuleset(), 'Cannot tailor inside a ruleset')
          let t = this
          if (this.$_terms.alterations) {
            for (const { target: r, adjuster: s } of this.$_terms.alterations) {
              if (e.includes(r)) {
                t = s(t)
                n(
                  l.isSchema(t),
                  'Alteration adjuster for',
                  r,
                  'failed to return a schema object'
                )
              }
            }
          }
          t = t.$_modify({ each: (t) => t.tailor(e), ref: false })
          t.$_temp.ruleset = false
          return t.$_mutateRebuild()
        }
        tracer() {
          return g.location ? g.location(this) : this
        }
        validate(e, t) {
          return y.entry(e, this, t)
        }
        validateAsync(e, t) {
          return y.entryAsync(e, this, t)
        }
        $_addRule(e) {
          if (typeof e === 'string') {
            e = { name: e }
          }
          n(e && typeof e === 'object', 'Invalid options')
          n(e.name && typeof e.name === 'string', 'Invalid rule name')
          for (const t in e) {
            n(t[0] !== '_', 'Cannot set private rule properties')
          }
          const t = Object.assign({}, e)
          t._resolve = []
          t.method = t.method || t.name
          const r = this._definition.rules[t.method]
          const s = t.args
          n(r, 'Unknown rule', t.method)
          const i = this.clone()
          if (s) {
            n(
              Object.keys(s).length === 1 ||
                Object.keys(s).length ===
                  this._definition.rules[t.name].args.length,
              'Invalid rule definition for',
              this.type,
              t.name
            )
            for (const e in s) {
              let o = s[e]
              if (o === undefined) {
                delete s[e]
                continue
              }
              if (r.argsByName) {
                const a = r.argsByName.get(e)
                if (a.ref && l.isResolvable(o)) {
                  t._resolve.push(e)
                  i.$_mutateRegister(o)
                } else {
                  if (a.normalize) {
                    o = a.normalize(o)
                    s[e] = o
                  }
                  if (a.assert) {
                    const t = l.validateArg(o, e, a)
                    n(!t, t, 'or reference')
                  }
                }
              }
              s[e] = o
            }
          }
          if (!r.multi) {
            i._ruleRemove(t.name, { clone: false })
            i._singleRules.set(t.name, t)
          }
          if (i.$_temp.ruleset === false) {
            i.$_temp.ruleset = null
          }
          if (r.priority) {
            i._rules.unshift(t)
          } else {
            i._rules.push(t)
          }
          return i
        }
        $_compile(e, t) {
          return c.schema(this.$_root, e, t)
        }
        $_createError(e, t, r, n, s, i = {}) {
          const o = i.flags !== false ? this._flags : {}
          const a = i.messages
            ? m.merge(this._definition.messages, i.messages)
            : this._definition.messages
          return new u.Report(e, t, r, o, a, n, s)
        }
        $_getFlag(e) {
          return this._flags[e]
        }
        $_getRule(e) {
          return this._singleRules.get(e)
        }
        $_mapLabels(e) {
          e = Array.isArray(e) ? e : e.split('.')
          return this._ids.labels(e)
        }
        $_match(e, t, r, n) {
          r = Object.assign({}, r)
          r.abortEarly = true
          r._externals = false
          t.snapshot()
          const s = !y.validate(e, this, t, r, n).errors
          t.restore()
          return s
        }
        $_modify(e) {
          l.assertOptions(e, ['each', 'once', 'ref', 'schema'])
          return h.schema(this, e) || this
        }
        $_mutateRebuild() {
          n(!this._inRuleset(), 'Cannot add this rule inside a ruleset')
          this._refs.reset()
          this._ids.reset()
          const each = (e, { source: t, name: r, path: n, key: s }) => {
            const i = this._definition[t][r] && this._definition[t][r].register
            if (i !== false) {
              this.$_mutateRegister(e, { family: i, key: s })
            }
          }
          this.$_modify({ each: each })
          if (this._definition.rebuild) {
            this._definition.rebuild(this)
          }
          this.$_temp.ruleset = false
          return this
        }
        $_mutateRegister(e, { family: t, key: r } = {}) {
          this._refs.register(e, t)
          this._ids.register(e, { key: r })
        }
        $_property(e) {
          return this._definition.properties[e]
        }
        $_reach(e) {
          return this._ids.reach(e)
        }
        $_rootReferences() {
          return this._refs.roots()
        }
        $_setFlag(e, t, r = {}) {
          n(
            e[0] === '_' || !this._inRuleset(),
            'Cannot set flag inside a ruleset'
          )
          const s = this._definition.flags[e] || {}
          if (i(t, s.default)) {
            t = undefined
          }
          if (i(t, this._flags[e])) {
            return this
          }
          const o = r.clone !== false ? this.clone() : this
          if (t !== undefined) {
            o._flags[e] = t
            o.$_mutateRegister(t)
          } else {
            delete o._flags[e]
          }
          if (e[0] !== '_') {
            o.$_temp.ruleset = false
          }
          return o
        }
        $_validate(e, t, r) {
          return y.validate(e, this, t, r)
        }
        _assign(e) {
          e.type = this.type
          e.$_root = this.$_root
          e.$_temp = Object.assign({}, this.$_temp)
          e.$_temp.whens = {}
          e._ids = this._ids.clone()
          e._preferences = this._preferences
          e._valids = this._valids && this._valids.clone()
          e._invalids = this._invalids && this._invalids.clone()
          e._rules = this._rules.slice()
          e._singleRules = s(this._singleRules, { shallow: true })
          e._refs = this._refs.clone()
          e._flags = Object.assign({}, this._flags)
          e._cache = null
          e.$_terms = {}
          for (const t in this.$_terms) {
            e.$_terms[t] = this.$_terms[t] ? this.$_terms[t].slice() : null
          }
          e.$_super = {}
          for (const t in this.$_super) {
            e.$_super[t] = this._super[t].bind(e)
          }
          return e
        }
        _default(e, t, r = {}) {
          l.assertOptions(r, 'literal')
          n(t !== undefined, 'Missing', e, 'value')
          n(
            typeof t === 'function' || !r.literal,
            'Only function value supports literal option'
          )
          if (typeof t === 'function' && r.literal) {
            t = { [l.symbols.literal]: true, literal: t }
          }
          const s = this.$_setFlag(e, t)
          return s
        }
        _generate(e, t, r) {
          if (!this.$_terms.whens) {
            return { schema: this }
          }
          const n = []
          const s = []
          for (let i = 0; i < this.$_terms.whens.length; ++i) {
            const o = this.$_terms.whens[i]
            if (o.concat) {
              n.push(o.concat)
              s.push(`${i}.concat`)
              continue
            }
            const a = o.ref ? o.ref.resolve(e, t, r) : e
            const l = o.is ? [o] : o.switch
            const c = s.length
            for (let c = 0; c < l.length; ++c) {
              const { is: u, then: f, otherwise: d } = l[c]
              const m = `${i}${o.switch ? '.' + c : ''}`
              if (u.$_match(a, t.nest(u, `${m}.is`), r)) {
                if (f) {
                  const i = t.localize(
                    [...t.path, `${m}.then`],
                    t.ancestors,
                    t.schemas
                  )
                  const { schema: o, id: a } = f._generate(e, i, r)
                  n.push(o)
                  s.push(`${m}.then${a ? `(${a})` : ''}`)
                  break
                }
              } else if (d) {
                const i = t.localize(
                  [...t.path, `${m}.otherwise`],
                  t.ancestors,
                  t.schemas
                )
                const { schema: o, id: a } = d._generate(e, i, r)
                n.push(o)
                s.push(`${m}.otherwise${a ? `(${a})` : ''}`)
                break
              }
            }
            if (o.break && s.length > c) {
              break
            }
          }
          const i = s.join(', ')
          t.mainstay.tracer.debug(t, 'rule', 'when', i)
          if (!i) {
            return { schema: this }
          }
          if (!t.mainstay.tracer.active && this.$_temp.whens[i]) {
            return { schema: this.$_temp.whens[i], id: i }
          }
          let o = this
          if (this._definition.generate) {
            o = this._definition.generate(this, e, t, r)
          }
          for (const e of n) {
            o = o.concat(e)
          }
          if (this.$_root._tracer) {
            this.$_root._tracer._combine(o, [this, ...n])
          }
          this.$_temp.whens[i] = o
          return { schema: o, id: i }
        }
        _inner(e, t, r = {}) {
          n(!this._inRuleset(), `Cannot set ${e} inside a ruleset`)
          const s = this.clone()
          if (!s.$_terms[e] || r.override) {
            s.$_terms[e] = []
          }
          if (r.single) {
            s.$_terms[e].push(t)
          } else {
            s.$_terms[e].push(...t)
          }
          s.$_temp.ruleset = false
          return s
        }
        _inRuleset() {
          return this.$_temp.ruleset !== null && this.$_temp.ruleset !== false
        }
        _ruleRemove(e, t = {}) {
          if (!this._singleRules.has(e)) {
            return this
          }
          const r = t.clone !== false ? this.clone() : this
          r._singleRules.delete(e)
          const n = []
          for (let t = 0; t < r._rules.length; ++t) {
            const s = r._rules[t]
            if (s.name === e && !s.keep) {
              if (r._inRuleset() && t < r.$_temp.ruleset) {
                --r.$_temp.ruleset
              }
              continue
            }
            n.push(s)
          }
          r._rules = n
          return r
        }
        _values(e, t) {
          l.verifyFlat(e, t.slice(1, -1))
          const r = this.clone()
          const s = e[0] === l.symbols.override
          if (s) {
            e = e.slice(1)
          }
          if (!r[t] && e.length) {
            r[t] = new b()
          } else if (s) {
            r[t] = e.length ? new b() : null
            r.$_mutateRebuild()
          }
          if (!r[t]) {
            return r
          }
          if (s) {
            r[t].override()
          }
          for (const s of e) {
            n(s !== undefined, 'Cannot call allow/valid/invalid with undefined')
            n(s !== l.symbols.override, 'Override must be the first value')
            const e = t === '_invalids' ? '_valids' : '_invalids'
            if (r[e]) {
              r[e].remove(s)
              if (!r[e].length) {
                n(
                  t === '_valids' || !r._flags.only,
                  'Setting invalid value',
                  s,
                  'leaves schema rejecting all values due to previous valid rule'
                )
                r[e] = null
              }
            }
            r[t].add(s, r._refs)
          }
          return r
        }
      }
      _.Base.prototype[l.symbols.any] = {
        version: l.version,
        compile: c.compile,
        root: '$_root',
      }
      _.Base.prototype.isImmutable = true
      _.Base.prototype.deny = _.Base.prototype.invalid
      _.Base.prototype.disallow = _.Base.prototype.invalid
      _.Base.prototype.equal = _.Base.prototype.valid
      _.Base.prototype.exist = _.Base.prototype.required
      _.Base.prototype.not = _.Base.prototype.invalid
      _.Base.prototype.options = _.Base.prototype.prefs
      _.Base.prototype.preferences = _.Base.prototype.prefs
      e.exports = new _.Base()
    },
    9178: function (e, t, r) {
      const n = r(8309)
      const s = r(546)
      const i = r(7614)
      const o = {
        max: 1e3,
        supported: new Set(['undefined', 'boolean', 'number', 'string']),
      }
      t.provider = {
        provision(e) {
          return new o.Cache(e)
        },
      }
      o.Cache = class {
        constructor(e = {}) {
          i.assertOptions(e, ['max'])
          n(
            e.max === undefined || (e.max && e.max > 0 && isFinite(e.max)),
            'Invalid max cache size'
          )
          this._max = e.max || o.max
          this._map = new Map()
          this._list = new o.List()
        }
        get length() {
          return this._map.size
        }
        set(e, t) {
          if (e !== null && !o.supported.has(typeof e)) {
            return
          }
          let r = this._map.get(e)
          if (r) {
            r.value = t
            this._list.first(r)
            return
          }
          r = this._list.unshift({ key: e, value: t })
          this._map.set(e, r)
          this._compact()
        }
        get(e) {
          const t = this._map.get(e)
          if (t) {
            this._list.first(t)
            return s(t.value)
          }
        }
        _compact() {
          if (this._map.size > this._max) {
            const e = this._list.pop()
            this._map.delete(e.key)
          }
        }
      }
      o.List = class {
        constructor() {
          this.tail = null
          this.head = null
        }
        unshift(e) {
          e.next = null
          e.prev = this.head
          if (this.head) {
            this.head.next = e
          }
          this.head = e
          if (!this.tail) {
            this.tail = e
          }
          return e
        }
        first(e) {
          if (e === this.head) {
            return
          }
          this._remove(e)
          this.unshift(e)
        }
        pop() {
          return this._remove(this.tail)
        }
        _remove(e) {
          const { next: t, prev: r } = e
          t.prev = r
          if (r) {
            r.next = t
          }
          if (e === this.tail) {
            this.tail = t
          }
          e.prev = null
          e.next = null
          return e
        }
      }
    },
    7614: function (e, t, r) {
      const n = r(8309)
      const s = r(7534)
      const i = r(5471)
      let o
      let a
      const l = {
        isoDate:
          /^(?:[-+]\d{2})?(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/,
      }
      t.version = i.version
      t.defaults = {
        abortEarly: true,
        allowUnknown: false,
        cache: true,
        context: null,
        convert: true,
        dateFormat: 'iso',
        errors: {
          escapeHtml: false,
          label: 'path',
          language: null,
          render: true,
          stack: false,
          wrap: { label: '"', array: '[]' },
        },
        externals: true,
        messages: {},
        nonEnumerables: false,
        noDefaults: false,
        presence: 'optional',
        skipFunctions: false,
        stripUnknown: false,
        warnings: false,
      }
      t.symbols = {
        any: Symbol.for('@hapi/joi/schema'),
        arraySingle: Symbol('arraySingle'),
        deepDefault: Symbol('deepDefault'),
        literal: Symbol('literal'),
        override: Symbol('override'),
        prefs: Symbol('prefs'),
        ref: Symbol('ref'),
        values: Symbol('values'),
        template: Symbol('template'),
      }
      t.assertOptions = function (e, t, r = 'Options') {
        n(
          e && typeof e === 'object' && !Array.isArray(e),
          'Options must be of type object'
        )
        const s = Object.keys(e).filter((e) => !t.includes(e))
        n(s.length === 0, `${r} contain unknown keys: ${s}`)
      }
      t.checkPreferences = function (e) {
        a = a || r(5684)
        const t = a.preferences.validate(e)
        if (t.error) {
          throw new s([t.error.details[0].message])
        }
      }
      t.compare = function (e, t, r) {
        switch (r) {
          case '=':
            return e === t
          case '>':
            return e > t
          case '<':
            return e < t
          case '>=':
            return e >= t
          case '<=':
            return e <= t
        }
      }
      t['default'] = function (e, t) {
        return e === undefined ? t : e
      }
      t.isIsoDate = function (e) {
        return l.isoDate.test(e)
      }
      t.isNumber = function (e) {
        return typeof e === 'number' && !isNaN(e)
      }
      t.isResolvable = function (e) {
        if (!e) {
          return false
        }
        return e[t.symbols.ref] || e[t.symbols.template]
      }
      t.isSchema = function (e, r = {}) {
        const s = e && e[t.symbols.any]
        if (!s) {
          return false
        }
        n(
          r.legacy || s.version === t.version,
          'Cannot mix different versions of joi schemas'
        )
        return true
      }
      t.isValues = function (e) {
        return e[t.symbols.values]
      }
      t.limit = function (e) {
        return Number.isSafeInteger(e) && e >= 0
      }
      t.preferences = function (e, n) {
        o = o || r(7889)
        e = e || {}
        n = n || {}
        const s = Object.assign({}, e, n)
        if (n.errors && e.errors) {
          s.errors = Object.assign({}, e.errors, n.errors)
          s.errors.wrap = Object.assign({}, e.errors.wrap, n.errors.wrap)
        }
        if (n.messages) {
          s.messages = o.compile(n.messages, e.messages)
        }
        delete s[t.symbols.prefs]
        return s
      }
      t.tryWithPath = function (e, t, r = {}) {
        try {
          return e()
        } catch (e) {
          if (e.path !== undefined) {
            e.path = t + '.' + e.path
          } else {
            e.path = t
          }
          if (r.append) {
            e.message = `${e.message} (${e.path})`
          }
          throw e
        }
      }
      t.validateArg = function (e, r, { assert: n, message: s }) {
        if (t.isSchema(n)) {
          const t = n.validate(e)
          if (!t.error) {
            return
          }
          return t.error.message
        } else if (!n(e)) {
          return r ? `${r} ${s}` : s
        }
      }
      t.verifyFlat = function (e, t) {
        for (const r of e) {
          n(!Array.isArray(r), 'Method no longer accepts array arguments:', t)
        }
      }
    },
    1039: function (e, t, r) {
      const n = r(8309)
      const s = r(7614)
      const i = r(5039)
      const o = {}
      t.schema = function (e, t, r = {}) {
        s.assertOptions(r, ['appendPath', 'override'])
        try {
          return o.schema(e, t, r)
        } catch (e) {
          if (r.appendPath && e.path !== undefined) {
            e.message = `${e.message} (${e.path})`
          }
          throw e
        }
      }
      o.schema = function (e, t, r) {
        n(t !== undefined, 'Invalid undefined schema')
        if (Array.isArray(t)) {
          n(t.length, 'Invalid empty array schema')
          if (t.length === 1) {
            t = t[0]
          }
        }
        const valid = (t, ...n) => {
          if (r.override !== false) {
            return t.valid(e.override, ...n)
          }
          return t.valid(...n)
        }
        if (o.simple(t)) {
          return valid(e, t)
        }
        if (typeof t === 'function') {
          return e.custom(t)
        }
        n(typeof t === 'object', 'Invalid schema content:', typeof t)
        if (s.isResolvable(t)) {
          return valid(e, t)
        }
        if (s.isSchema(t)) {
          return t
        }
        if (Array.isArray(t)) {
          for (const r of t) {
            if (!o.simple(r)) {
              return e.alternatives().try(...t)
            }
          }
          return valid(e, ...t)
        }
        if (t instanceof RegExp) {
          return e.string().regex(t)
        }
        if (t instanceof Date) {
          return valid(e.date(), t)
        }
        n(
          Object.getPrototypeOf(t) === Object.getPrototypeOf({}),
          'Schema can only contain plain objects'
        )
        return e.object().keys(t)
      }
      t.ref = function (e, t) {
        return i.isRef(e) ? e : i.create(e, t)
      }
      t.compile = function (e, r, i = {}) {
        s.assertOptions(i, ['legacy'])
        const a = r && r[s.symbols.any]
        if (a) {
          n(
            i.legacy || a.version === s.version,
            'Cannot mix different versions of joi schemas:',
            a.version,
            s.version
          )
          return r
        }
        if (typeof r !== 'object' || !i.legacy) {
          return t.schema(e, r, { appendPath: true })
        }
        const l = o.walk(r)
        if (!l) {
          return t.schema(e, r, { appendPath: true })
        }
        return l.compile(l.root, r)
      }
      o.walk = function (e) {
        if (typeof e !== 'object') {
          return null
        }
        if (Array.isArray(e)) {
          for (const t of e) {
            const e = o.walk(t)
            if (e) {
              return e
            }
          }
          return null
        }
        const t = e[s.symbols.any]
        if (t) {
          return { root: e[t.root], compile: t.compile }
        }
        n(
          Object.getPrototypeOf(e) === Object.getPrototypeOf({}),
          'Schema can only contain plain objects'
        )
        for (const t in e) {
          const r = o.walk(e[t])
          if (r) {
            return r
          }
        }
        return null
      }
      o.simple = function (e) {
        return e === null || ['boolean', 'string', 'number'].includes(typeof e)
      }
      t.when = function (e, r, a) {
        if (a === undefined) {
          n(r && typeof r === 'object', 'Missing options')
          a = r
          r = i.create('.')
        }
        if (Array.isArray(a)) {
          a = { switch: a }
        }
        s.assertOptions(a, [
          'is',
          'not',
          'then',
          'otherwise',
          'switch',
          'break',
        ])
        if (s.isSchema(r)) {
          n(a.is === undefined, '"is" can not be used with a schema condition')
          n(
            a.not === undefined,
            '"not" can not be used with a schema condition'
          )
          n(
            a.switch === undefined,
            '"switch" can not be used with a schema condition'
          )
          return o.condition(e, {
            is: r,
            then: a.then,
            otherwise: a.otherwise,
            break: a.break,
          })
        }
        n(i.isRef(r) || typeof r === 'string', 'Invalid condition:', r)
        n(
          a.not === undefined || a.is === undefined,
          'Cannot combine "is" with "not"'
        )
        if (a.switch === undefined) {
          let l = a
          if (a.not !== undefined) {
            l = {
              is: a.not,
              then: a.otherwise,
              otherwise: a.then,
              break: a.break,
            }
          }
          let c =
            l.is !== undefined
              ? e.$_compile(l.is)
              : e.$_root.invalid(null, false, 0, '').required()
          n(
            l.then !== undefined || l.otherwise !== undefined,
            'options must have at least one of "then", "otherwise", or "switch"'
          )
          n(
            l.break === undefined ||
              l.then === undefined ||
              l.otherwise === undefined,
            'Cannot specify then, otherwise, and break all together'
          )
          if (a.is !== undefined && !i.isRef(a.is) && !s.isSchema(a.is)) {
            c = c.required()
          }
          return o.condition(e, {
            ref: t.ref(r),
            is: c,
            then: l.then,
            otherwise: l.otherwise,
            break: l.break,
          })
        }
        n(Array.isArray(a.switch), '"switch" must be an array')
        n(a.is === undefined, 'Cannot combine "switch" with "is"')
        n(a.not === undefined, 'Cannot combine "switch" with "not"')
        n(a.then === undefined, 'Cannot combine "switch" with "then"')
        const l = { ref: t.ref(r), switch: [], break: a.break }
        for (let t = 0; t < a.switch.length; ++t) {
          const r = a.switch[t]
          const o = t === a.switch.length - 1
          s.assertOptions(r, o ? ['is', 'then', 'otherwise'] : ['is', 'then'])
          n(r.is !== undefined, 'Switch statement missing "is"')
          n(r.then !== undefined, 'Switch statement missing "then"')
          const c = { is: e.$_compile(r.is), then: e.$_compile(r.then) }
          if (!i.isRef(r.is) && !s.isSchema(r.is)) {
            c.is = c.is.required()
          }
          if (o) {
            n(
              a.otherwise === undefined || r.otherwise === undefined,
              'Cannot specify "otherwise" inside and outside a "switch"'
            )
            const t = a.otherwise !== undefined ? a.otherwise : r.otherwise
            if (t !== undefined) {
              n(
                l.break === undefined,
                'Cannot specify both otherwise and break'
              )
              c.otherwise = e.$_compile(t)
            }
          }
          l.switch.push(c)
        }
        return l
      }
      o.condition = function (e, t) {
        for (const r of ['then', 'otherwise']) {
          if (t[r] === undefined) {
            delete t[r]
          } else {
            t[r] = e.$_compile(t[r])
          }
        }
        return t
      }
    },
    3377: function (e, t, r) {
      const n = r(5483)
      const s = r(7614)
      const i = r(4823)
      const o = {}
      t.Report = class {
        constructor(e, r, n, s, i, o, a) {
          this.code = e
          this.flags = s
          this.messages = i
          this.path = o.path
          this.prefs = a
          this.state = o
          this.value = r
          this.message = null
          this.template = null
          this.local = n || {}
          this.local.label = t.label(
            this.flags,
            this.state,
            this.prefs,
            this.messages
          )
          if (this.value !== undefined && !this.local.hasOwnProperty('value')) {
            this.local.value = this.value
          }
          if (this.path.length) {
            const e = this.path[this.path.length - 1]
            if (typeof e !== 'object') {
              this.local.key = e
            }
          }
        }
        _setTemplate(e) {
          this.template = e
          if (!this.flags.label && this.path.length === 0) {
            const e = this._template(this.template, 'root')
            if (e) {
              this.local.label = e
            }
          }
        }
        toString() {
          if (this.message) {
            return this.message
          }
          const e = this.code
          if (!this.prefs.errors.render) {
            return this.code
          }
          const t =
            this._template(this.template) ||
            this._template(this.prefs.messages) ||
            this._template(this.messages)
          if (t === undefined) {
            return `Error code "${e}" is not defined, your custom type is missing the correct messages definition`
          }
          this.message = t.render(
            this.value,
            this.state,
            this.prefs,
            this.local,
            {
              errors: this.prefs.errors,
              messages: [this.prefs.messages, this.messages],
            }
          )
          if (!this.prefs.errors.label) {
            this.message = this.message.replace(/^"" /, '').trim()
          }
          return this.message
        }
        _template(e, r) {
          return t.template(
            this.value,
            e,
            r || this.code,
            this.state,
            this.prefs
          )
        }
      }
      t.path = function (e) {
        let t = ''
        for (const r of e) {
          if (typeof r === 'object') {
            continue
          }
          if (typeof r === 'string') {
            if (t) {
              t += '.'
            }
            t += r
          } else {
            t += `[${r}]`
          }
        }
        return t
      }
      t.template = function (e, t, r, n, o) {
        if (!t) {
          return
        }
        if (i.isTemplate(t)) {
          return r !== 'root' ? t : null
        }
        let a = o.errors.language
        if (s.isResolvable(a)) {
          a = a.resolve(e, n, o)
        }
        if (a && t[a] && t[a][r] !== undefined) {
          return t[a][r]
        }
        return t[r]
      }
      t.label = function (e, r, n, s) {
        if (e.label) {
          return e.label
        }
        if (!n.errors.label) {
          return ''
        }
        let i = r.path
        if (n.errors.label === 'key' && r.path.length > 1) {
          i = r.path.slice(-1)
        }
        const o = t.path(i)
        if (o) {
          return o
        }
        return (
          t.template(null, n.messages, 'root', r, n) ||
          (s && t.template(null, s, 'root', r, n)) ||
          'value'
        )
      }
      t.process = function (e, r, n) {
        if (!e) {
          return null
        }
        const { override: s, message: i, details: o } = t.details(e)
        if (s) {
          return s
        }
        if (n.errors.stack) {
          return new t.ValidationError(i, o, r)
        }
        const a = Error.stackTraceLimit
        Error.stackTraceLimit = 0
        const l = new t.ValidationError(i, o, r)
        Error.stackTraceLimit = a
        return l
      }
      t.details = function (e, t = {}) {
        let r = []
        const n = []
        for (const s of e) {
          if (s instanceof Error) {
            if (t.override !== false) {
              return { override: s }
            }
            const e = s.toString()
            r.push(e)
            n.push({ message: e, type: 'override', context: { error: s } })
            continue
          }
          const e = s.toString()
          r.push(e)
          n.push({
            message: e,
            path: s.path.filter((e) => typeof e !== 'object'),
            type: s.code,
            context: s.local,
          })
        }
        if (r.length > 1) {
          r = [...new Set(r)]
        }
        return { message: r.join('. '), details: n }
      }
      t.ValidationError = class extends Error {
        constructor(e, t, r) {
          super(e)
          this._original = r
          this.details = t
        }
        static isError(e) {
          return e instanceof t.ValidationError
        }
      }
      t.ValidationError.prototype.isJoi = true
      t.ValidationError.prototype.name = 'ValidationError'
      t.ValidationError.prototype.annotate = n.error
    },
    1897: function (e, t, r) {
      const n = r(8309)
      const s = r(546)
      const i = r(7614)
      const o = r(7889)
      const a = {}
      t.type = function (e, t) {
        const r = Object.getPrototypeOf(e)
        const l = s(r)
        const c = e._assign(Object.create(l))
        const u = Object.assign({}, t)
        delete u.base
        l._definition = u
        const f = r._definition || {}
        u.messages = o.merge(f.messages, u.messages)
        u.properties = Object.assign({}, f.properties, u.properties)
        c.type = u.type
        u.flags = Object.assign({}, f.flags, u.flags)
        const d = Object.assign({}, f.terms)
        if (u.terms) {
          for (const e in u.terms) {
            const t = u.terms[e]
            n(
              c.$_terms[e] === undefined,
              'Invalid term override for',
              u.type,
              e
            )
            c.$_terms[e] = t.init
            d[e] = t
          }
        }
        u.terms = d
        if (!u.args) {
          u.args = f.args
        }
        u.prepare = a.prepare(u.prepare, f.prepare)
        if (u.coerce) {
          if (typeof u.coerce === 'function') {
            u.coerce = { method: u.coerce }
          }
          if (u.coerce.from && !Array.isArray(u.coerce.from)) {
            u.coerce = {
              method: u.coerce.method,
              from: [].concat(u.coerce.from),
            }
          }
        }
        u.coerce = a.coerce(u.coerce, f.coerce)
        u.validate = a.validate(u.validate, f.validate)
        const m = Object.assign({}, f.rules)
        if (u.rules) {
          for (const e in u.rules) {
            const t = u.rules[e]
            n(typeof t === 'object', 'Invalid rule definition for', u.type, e)
            let r = t.method
            if (r === undefined) {
              r = function () {
                return this.$_addRule(e)
              }
            }
            if (r) {
              n(!l[e], 'Rule conflict in', u.type, e)
              l[e] = r
            }
            n(!m[e], 'Rule conflict in', u.type, e)
            m[e] = t
            if (t.alias) {
              const e = [].concat(t.alias)
              for (const r of e) {
                l[r] = t.method
              }
            }
            if (t.args) {
              t.argsByName = new Map()
              t.args = t.args.map((e) => {
                if (typeof e === 'string') {
                  e = { name: e }
                }
                n(!t.argsByName.has(e.name), 'Duplicated argument name', e.name)
                if (i.isSchema(e.assert)) {
                  e.assert = e.assert.strict().label(e.name)
                }
                t.argsByName.set(e.name, e)
                return e
              })
            }
          }
        }
        u.rules = m
        const h = Object.assign({}, f.modifiers)
        if (u.modifiers) {
          for (const e in u.modifiers) {
            n(!l[e], 'Rule conflict in', u.type, e)
            const t = u.modifiers[e]
            n(
              typeof t === 'function',
              'Invalid modifier definition for',
              u.type,
              e
            )
            const method = function (t) {
              return this.rule({ [e]: t })
            }
            l[e] = method
            h[e] = t
          }
        }
        u.modifiers = h
        if (u.overrides) {
          l._super = r
          c.$_super = {}
          for (const e in u.overrides) {
            n(r[e], 'Cannot override missing', e)
            c.$_super[e] = r[e].bind(c)
          }
          Object.assign(l, u.overrides)
        }
        u.cast = Object.assign({}, f.cast, u.cast)
        const p = Object.assign({}, f.manifest, u.manifest)
        p.build = a.build(
          u.manifest && u.manifest.build,
          f.manifest && f.manifest.build
        )
        u.manifest = p
        u.rebuild = a.rebuild(u.rebuild, f.rebuild)
        return c
      }
      a.build = function (e, t) {
        if (!e || !t) {
          return e || t
        }
        return function (r, n) {
          return t(e(r, n), n)
        }
      }
      a.coerce = function (e, t) {
        if (!e || !t) {
          return e || t
        }
        return {
          from: e.from && t.from ? [...new Set([...e.from, ...t.from])] : null,
          method(r, n) {
            let s
            if (!t.from || t.from.includes(typeof r)) {
              s = t.method(r, n)
              if (s) {
                if (s.errors || s.value === undefined) {
                  return s
                }
                r = s.value
              }
            }
            if (!e.from || e.from.includes(typeof r)) {
              const t = e.method(r, n)
              if (t) {
                return t
              }
            }
            return s
          },
        }
      }
      a.prepare = function (e, t) {
        if (!e || !t) {
          return e || t
        }
        return function (r, n) {
          const s = e(r, n)
          if (s) {
            if (s.errors || s.value === undefined) {
              return s
            }
            r = s.value
          }
          return t(r, n) || s
        }
      }
      a.rebuild = function (e, t) {
        if (!e || !t) {
          return e || t
        }
        return function (r) {
          t(r)
          e(r)
        }
      }
      a.validate = function (e, t) {
        if (!e || !t) {
          return e || t
        }
        return function (r, n) {
          const s = t(r, n)
          if (s) {
            if (s.errors && (!Array.isArray(s.errors) || s.errors.length)) {
              return s
            }
            r = s.value
          }
          return e(r, n) || s
        }
      }
    },
    7268: function (e, t, r) {
      const n = r(8309)
      const s = r(546)
      const i = r(9178)
      const o = r(7614)
      const a = r(1039)
      const l = r(3377)
      const c = r(1897)
      const u = r(2785)
      const f = r(5039)
      const d = r(4823)
      const m = r(1943)
      let h
      const p = {
        types: {
          alternatives: r(1074),
          any: r(7379),
          array: r(9920),
          boolean: r(3748),
          date: r(3223),
          function: r(3350),
          link: r(7254),
          number: r(1163),
          object: r(7381),
          string: r(8448),
          symbol: r(1824),
        },
        aliases: { alt: 'alternatives', bool: 'boolean', func: 'function' },
      }
      if (Buffer) {
        p.types.binary = r(5548)
      }
      p.root = function () {
        const e = { _types: new Set(Object.keys(p.types)) }
        for (const t of e._types) {
          e[t] = function (...e) {
            n(
              !e.length || ['alternatives', 'link', 'object'].includes(t),
              'The',
              t,
              'type does not allow arguments'
            )
            return p.generate(this, p.types[t], e)
          }
        }
        for (const t of [
          'allow',
          'custom',
          'disallow',
          'equal',
          'exist',
          'forbidden',
          'invalid',
          'not',
          'only',
          'optional',
          'options',
          'prefs',
          'preferences',
          'required',
          'strip',
          'valid',
          'when',
        ]) {
          e[t] = function (...e) {
            return this.any()[t](...e)
          }
        }
        Object.assign(e, p.methods)
        for (const t in p.aliases) {
          const r = p.aliases[t]
          e[t] = e[r]
        }
        e.x = e.expression
        if (m.setup) {
          m.setup(e)
        }
        return e
      }
      p.methods = {
        ValidationError: l.ValidationError,
        version: o.version,
        cache: i.provider,
        assert(e, t, ...r) {
          p.assert(e, t, true, r)
        },
        attempt(e, t, ...r) {
          return p.assert(e, t, false, r)
        },
        build(e) {
          n(typeof u.build === 'function', 'Manifest functionality disabled')
          return u.build(this, e)
        },
        checkPreferences(e) {
          o.checkPreferences(e)
        },
        compile(e, t) {
          return a.compile(this, e, t)
        },
        defaults(e) {
          n(typeof e === 'function', 'modifier must be a function')
          const t = Object.assign({}, this)
          for (const r of t._types) {
            const s = e(t[r]())
            n(o.isSchema(s), 'modifier must return a valid schema object')
            t[r] = function (...e) {
              return p.generate(this, s, e)
            }
          }
          return t
        },
        expression(...e) {
          return new d(...e)
        },
        extend(...e) {
          o.verifyFlat(e, 'extend')
          h = h || r(5684)
          n(e.length, 'You need to provide at least one extension')
          this.assert(e, h.extensions)
          const t = Object.assign({}, this)
          t._types = new Set(t._types)
          for (let r of e) {
            if (typeof r === 'function') {
              r = r(t)
            }
            this.assert(r, h.extension)
            const e = p.expandExtension(r, t)
            for (const r of e) {
              n(
                t[r.type] === undefined || t._types.has(r.type),
                'Cannot override name',
                r.type
              )
              const e = r.base || this.any()
              const s = c.type(e, r)
              t._types.add(r.type)
              t[r.type] = function (...e) {
                return p.generate(this, s, e)
              }
            }
          }
          return t
        },
        isError: l.ValidationError.isError,
        isExpression: d.isTemplate,
        isRef: f.isRef,
        isSchema: o.isSchema,
        in(...e) {
          return f.in(...e)
        },
        override: o.symbols.override,
        ref(...e) {
          return f.create(...e)
        },
        types() {
          const e = {}
          for (const t of this._types) {
            e[t] = this[t]()
          }
          for (const t in p.aliases) {
            e[t] = this[t]()
          }
          return e
        },
      }
      p.assert = function (e, t, r, n) {
        const i =
          n[0] instanceof Error || typeof n[0] === 'string' ? n[0] : null
        const a = i ? n[1] : n[0]
        const c = t.validate(
          e,
          o.preferences({ errors: { stack: true } }, a || {})
        )
        let u = c.error
        if (!u) {
          return c.value
        }
        if (i instanceof Error) {
          throw i
        }
        const f =
          r && typeof u.annotate === 'function' ? u.annotate() : u.message
        if (u instanceof l.ValidationError === false) {
          u = s(u)
        }
        u.message = i ? `${i} ${f}` : f
        throw u
      }
      p.generate = function (e, t, r) {
        n(e, 'Must be invoked on a Joi instance.')
        t.$_root = e
        if (!t._definition.args || !r.length) {
          return t
        }
        return t._definition.args(t, ...r)
      }
      p.expandExtension = function (e, t) {
        if (typeof e.type === 'string') {
          return [e]
        }
        const r = []
        for (const n of t._types) {
          if (e.type.test(n)) {
            const s = Object.assign({}, e)
            s.type = n
            s.base = t[n]()
            r.push(s)
          }
        }
        return r
      }
      e.exports = p.root()
    },
    2785: function (e, t, r) {
      const n = r(8309)
      const s = r(546)
      const i = r(7614)
      const o = r(7889)
      const a = r(5039)
      const l = r(4823)
      let c
      const u = {}
      t.describe = function (e) {
        const t = e._definition
        const r = { type: e.type, flags: {}, rules: [] }
        for (const t in e._flags) {
          if (t[0] !== '_') {
            r.flags[t] = u.describe(e._flags[t])
          }
        }
        if (!Object.keys(r.flags).length) {
          delete r.flags
        }
        if (e._preferences) {
          r.preferences = s(e._preferences, { shallow: ['messages'] })
          delete r.preferences[i.symbols.prefs]
          if (r.preferences.messages) {
            r.preferences.messages = o.decompile(r.preferences.messages)
          }
        }
        if (e._valids) {
          r.allow = e._valids.describe()
        }
        if (e._invalids) {
          r.invalid = e._invalids.describe()
        }
        for (const n of e._rules) {
          const e = t.rules[n.name]
          if (e.manifest === false) {
            continue
          }
          const s = { name: n.name }
          for (const e in t.modifiers) {
            if (n[e] !== undefined) {
              s[e] = u.describe(n[e])
            }
          }
          if (n.args) {
            s.args = {}
            for (const e in n.args) {
              const t = n.args[e]
              if (e === 'options' && !Object.keys(t).length) {
                continue
              }
              s.args[e] = u.describe(t, { assign: e })
            }
            if (!Object.keys(s.args).length) {
              delete s.args
            }
          }
          r.rules.push(s)
        }
        if (!r.rules.length) {
          delete r.rules
        }
        for (const s in e.$_terms) {
          if (s[0] === '_') {
            continue
          }
          n(
            !r[s],
            'Cannot describe schema due to internal name conflict with',
            s
          )
          const o = e.$_terms[s]
          if (!o) {
            continue
          }
          if (o instanceof Map) {
            if (o.size) {
              r[s] = [...o.entries()]
            }
            continue
          }
          if (i.isValues(o)) {
            r[s] = o.describe()
            continue
          }
          n(t.terms[s], 'Term', s, 'missing configuration')
          const a = t.terms[s].manifest
          const l = typeof a === 'object'
          if (!o.length && !l) {
            continue
          }
          const c = []
          for (const e of o) {
            c.push(u.describe(e))
          }
          if (l) {
            const { from: e, to: t } = a.mapped
            r[s] = {}
            for (const n of c) {
              r[s][n[t]] = n[e]
            }
            continue
          }
          if (a === 'single') {
            n(c.length === 1, 'Term', s, 'contains more than one item')
            r[s] = c[0]
            continue
          }
          r[s] = c
        }
        u.validate(e.$_root, r)
        return r
      }
      u.describe = function (e, t = {}) {
        if (Array.isArray(e)) {
          return e.map(u.describe)
        }
        if (e === i.symbols.deepDefault) {
          return { special: 'deep' }
        }
        if (typeof e !== 'object' || e === null) {
          return e
        }
        if (t.assign === 'options') {
          return s(e)
        }
        if (Buffer && Buffer.isBuffer(e)) {
          return { buffer: e.toString('binary') }
        }
        if (e instanceof Date) {
          return e.toISOString()
        }
        if (e instanceof Error) {
          return e
        }
        if (e instanceof RegExp) {
          if (t.assign === 'regex') {
            return e.toString()
          }
          return { regex: e.toString() }
        }
        if (e[i.symbols.literal]) {
          return { function: e.literal }
        }
        if (typeof e.describe === 'function') {
          if (t.assign === 'ref') {
            return e.describe().ref
          }
          return e.describe()
        }
        const r = {}
        for (const t in e) {
          const n = e[t]
          if (n === undefined) {
            continue
          }
          r[t] = u.describe(n, { assign: t })
        }
        return r
      }
      t.build = function (e, t) {
        const r = new u.Builder(e)
        return r.parse(t)
      }
      u.Builder = class {
        constructor(e) {
          this.joi = e
        }
        parse(e) {
          u.validate(this.joi, e)
          let t = this.joi[e.type]()
          const r = t._definition
          if (e.flags) {
            for (const s in e.flags) {
              const i = (r.flags[s] && r.flags[s].setter) || s
              n(
                typeof t[i] === 'function',
                'Invalid flag',
                s,
                'for type',
                e.type
              )
              t = t[i](this.build(e.flags[s]))
            }
          }
          if (e.preferences) {
            t = t.preferences(this.build(e.preferences))
          }
          if (e.allow) {
            t = t.allow(...this.build(e.allow))
          }
          if (e.invalid) {
            t = t.invalid(...this.build(e.invalid))
          }
          if (e.rules) {
            for (const s of e.rules) {
              n(
                typeof t[s.name] === 'function',
                'Invalid rule',
                s.name,
                'for type',
                e.type
              )
              const i = []
              if (s.args) {
                const t = {}
                for (const e in s.args) {
                  t[e] = this.build(s.args[e], { assign: e })
                }
                const o = Object.keys(t)
                const a = r.rules[s.name].args
                if (a) {
                  n(
                    o.length <= a.length,
                    'Invalid number of arguments for',
                    e.type,
                    s.name,
                    '(expected up to',
                    a.length,
                    ', found',
                    o.length,
                    ')'
                  )
                  for (const { name: e } of a) {
                    i.push(t[e])
                  }
                } else {
                  n(
                    o.length === 1,
                    'Invalid number of arguments for',
                    e.type,
                    s.name,
                    '(expected up to 1, found',
                    o.length,
                    ')'
                  )
                  i.push(t[o[0]])
                }
              }
              t = t[s.name](...i)
              const o = {}
              for (const e in r.modifiers) {
                if (s[e] !== undefined) {
                  o[e] = this.build(s[e])
                }
              }
              if (Object.keys(o).length) {
                t = t.rule(o)
              }
            }
          }
          const s = {}
          for (const t in e) {
            if (
              [
                'allow',
                'flags',
                'invalid',
                'whens',
                'preferences',
                'rules',
                'type',
              ].includes(t)
            ) {
              continue
            }
            n(r.terms[t], 'Term', t, 'missing configuration')
            const i = r.terms[t].manifest
            if (i === 'schema') {
              s[t] = e[t].map((e) => this.parse(e))
              continue
            }
            if (i === 'values') {
              s[t] = e[t].map((e) => this.build(e))
              continue
            }
            if (i === 'single') {
              s[t] = this.build(e[t])
              continue
            }
            if (typeof i === 'object') {
              s[t] = {}
              for (const r in e[t]) {
                const n = e[t][r]
                s[t][r] = this.parse(n)
              }
              continue
            }
            s[t] = this.build(e[t])
          }
          if (e.whens) {
            s.whens = e.whens.map((e) => this.build(e))
          }
          t = r.manifest.build(t, s)
          t.$_temp.ruleset = false
          return t
        }
        build(e, t = {}) {
          if (e === null) {
            return null
          }
          if (Array.isArray(e)) {
            return e.map((e) => this.build(e))
          }
          if (e instanceof Error) {
            return e
          }
          if (t.assign === 'options') {
            return s(e)
          }
          if (t.assign === 'regex') {
            return u.regex(e)
          }
          if (t.assign === 'ref') {
            return a.build(e)
          }
          if (typeof e !== 'object') {
            return e
          }
          if (Object.keys(e).length === 1) {
            if (e.buffer) {
              n(Buffer, 'Buffers are not supported')
              return Buffer && Buffer.from(e.buffer, 'binary')
            }
            if (e.function) {
              return { [i.symbols.literal]: true, literal: e.function }
            }
            if (e.override) {
              return i.symbols.override
            }
            if (e.ref) {
              return a.build(e.ref)
            }
            if (e.regex) {
              return u.regex(e.regex)
            }
            if (e.special) {
              n(
                ['deep'].includes(e.special),
                'Unknown special value',
                e.special
              )
              return i.symbols.deepDefault
            }
            if (e.value) {
              return s(e.value)
            }
          }
          if (e.type) {
            return this.parse(e)
          }
          if (e.template) {
            return l.build(e)
          }
          const r = {}
          for (const t in e) {
            r[t] = this.build(e[t], { assign: t })
          }
          return r
        }
      }
      u.regex = function (e) {
        const t = e.lastIndexOf('/')
        const r = e.slice(1, t)
        const n = e.slice(t + 1)
        return new RegExp(r, n)
      }
      u.validate = function (e, t) {
        c = c || r(5684)
        e.assert(t, c.description)
      }
    },
    7889: function (e, t, r) {
      const n = r(8309)
      const s = r(546)
      const i = r(4823)
      const o = {}
      t.compile = function (e, t) {
        if (typeof e === 'string') {
          n(!t, 'Cannot set single message string')
          return new i(e)
        }
        if (i.isTemplate(e)) {
          n(!t, 'Cannot set single message template')
          return e
        }
        n(typeof e === 'object' && !Array.isArray(e), 'Invalid message options')
        t = t ? s(t) : {}
        for (let r in e) {
          const s = e[r]
          if (r === 'root' || i.isTemplate(s)) {
            t[r] = s
            continue
          }
          if (typeof s === 'string') {
            t[r] = new i(s)
            continue
          }
          n(
            typeof s === 'object' && !Array.isArray(s),
            'Invalid message for',
            r
          )
          const o = r
          t[o] = t[o] || {}
          for (r in s) {
            const e = s[r]
            if (r === 'root' || i.isTemplate(e)) {
              t[o][r] = e
              continue
            }
            n(typeof e === 'string', 'Invalid message for', r, 'in', o)
            t[o][r] = new i(e)
          }
        }
        return t
      }
      t.decompile = function (e) {
        const t = {}
        for (let r in e) {
          const n = e[r]
          if (r === 'root') {
            t[r] = n
            continue
          }
          if (i.isTemplate(n)) {
            t[r] = n.describe({ compact: true })
            continue
          }
          const s = r
          t[s] = {}
          for (r in n) {
            const e = n[r]
            if (r === 'root') {
              t[s][r] = e
              continue
            }
            t[s][r] = e.describe({ compact: true })
          }
        }
        return t
      }
      t.merge = function (e, r) {
        if (!e) {
          return t.compile(r)
        }
        if (!r) {
          return e
        }
        if (typeof r === 'string') {
          return new i(r)
        }
        if (i.isTemplate(r)) {
          return r
        }
        const o = s(e)
        for (let e in r) {
          const t = r[e]
          if (e === 'root' || i.isTemplate(t)) {
            o[e] = t
            continue
          }
          if (typeof t === 'string') {
            o[e] = new i(t)
            continue
          }
          n(
            typeof t === 'object' && !Array.isArray(t),
            'Invalid message for',
            e
          )
          const s = e
          o[s] = o[s] || {}
          for (e in t) {
            const r = t[e]
            if (e === 'root' || i.isTemplate(r)) {
              o[s][e] = r
              continue
            }
            n(typeof r === 'string', 'Invalid message for', e, 'in', s)
            o[s][e] = new i(r)
          }
        }
        return o
      }
    },
    835: function (e, t, r) {
      const n = r(8309)
      const s = r(7614)
      const i = r(5039)
      const o = {}
      t.Ids = o.Ids = class {
        constructor() {
          this._byId = new Map()
          this._byKey = new Map()
          this._schemaChain = false
        }
        clone() {
          const e = new o.Ids()
          e._byId = new Map(this._byId)
          e._byKey = new Map(this._byKey)
          e._schemaChain = this._schemaChain
          return e
        }
        concat(e) {
          if (e._schemaChain) {
            this._schemaChain = true
          }
          for (const [t, r] of e._byId.entries()) {
            n(!this._byKey.has(t), 'Schema id conflicts with existing key:', t)
            this._byId.set(t, r)
          }
          for (const [t, r] of e._byKey.entries()) {
            n(!this._byId.has(t), 'Schema key conflicts with existing id:', t)
            this._byKey.set(t, r)
          }
        }
        fork(e, t, r) {
          const i = this._collect(e)
          i.push({ schema: r })
          const a = i.shift()
          let l = { id: a.id, schema: t(a.schema) }
          n(
            s.isSchema(l.schema),
            'adjuster function failed to return a joi schema type'
          )
          for (const e of i) {
            l = { id: e.id, schema: o.fork(e.schema, l.id, l.schema) }
          }
          return l.schema
        }
        labels(e, t = []) {
          const r = e[0]
          const n = this._get(r)
          if (!n) {
            return [...t, ...e].join('.')
          }
          const s = e.slice(1)
          t = [...t, n.schema._flags.label || r]
          if (!s.length) {
            return t.join('.')
          }
          return n.schema._ids.labels(s, t)
        }
        reach(e, t = []) {
          const r = e[0]
          const s = this._get(r)
          n(s, 'Schema does not contain path', [...t, ...e].join('.'))
          const i = e.slice(1)
          if (!i.length) {
            return s.schema
          }
          return s.schema._ids.reach(i, [...t, r])
        }
        register(e, { key: t } = {}) {
          if (!e || !s.isSchema(e)) {
            return
          }
          if (e.$_property('schemaChain') || e._ids._schemaChain) {
            this._schemaChain = true
          }
          const r = e._flags.id
          if (r) {
            const t = this._byId.get(r)
            n(
              !t || t.schema === e,
              'Cannot add different schemas with the same id:',
              r
            )
            n(!this._byKey.has(r), 'Schema id conflicts with existing key:', r)
            this._byId.set(r, { schema: e, id: r })
          }
          if (t) {
            n(!this._byKey.has(t), 'Schema already contains key:', t)
            n(!this._byId.has(t), 'Schema key conflicts with existing id:', t)
            this._byKey.set(t, { schema: e, id: t })
          }
        }
        reset() {
          this._byId = new Map()
          this._byKey = new Map()
          this._schemaChain = false
        }
        _collect(e, t = [], r = []) {
          const s = e[0]
          const i = this._get(s)
          n(i, 'Schema does not contain path', [...t, ...e].join('.'))
          r = [i, ...r]
          const o = e.slice(1)
          if (!o.length) {
            return r
          }
          return i.schema._ids._collect(o, [...t, s], r)
        }
        _get(e) {
          return this._byId.get(e) || this._byKey.get(e)
        }
      }
      o.fork = function (e, r, n) {
        const each = (e, { key: t }) => {
          if (r === (e._flags.id || t)) {
            return n
          }
        }
        const s = t.schema(e, { each: each, ref: false })
        return s ? s.$_mutateRebuild() : e
      }
      t.schema = function (e, t) {
        let r
        for (const n in e._flags) {
          if (n[0] === '_') {
            continue
          }
          const s = o.scan(e._flags[n], { source: 'flags', name: n }, t)
          if (s !== undefined) {
            r = r || e.clone()
            r._flags[n] = s
          }
        }
        for (let n = 0; n < e._rules.length; ++n) {
          const s = e._rules[n]
          const i = o.scan(s.args, { source: 'rules', name: s.name }, t)
          if (i !== undefined) {
            r = r || e.clone()
            const t = Object.assign({}, s)
            t.args = i
            r._rules[n] = t
            const o = r._singleRules.get(s.name)
            if (o === s) {
              r._singleRules.set(s.name, t)
            }
          }
        }
        for (const n in e.$_terms) {
          if (n[0] === '_') {
            continue
          }
          const s = o.scan(e.$_terms[n], { source: 'terms', name: n }, t)
          if (s !== undefined) {
            r = r || e.clone()
            r.$_terms[n] = s
          }
        }
        return r
      }
      o.scan = function (e, t, r, n, a) {
        const l = n || []
        if (e === null || typeof e !== 'object') {
          return
        }
        let c
        if (Array.isArray(e)) {
          for (let n = 0; n < e.length; ++n) {
            const s = t.source === 'terms' && t.name === 'keys' && e[n].key
            const i = o.scan(e[n], t, r, [n, ...l], s)
            if (i !== undefined) {
              c = c || e.slice()
              c[n] = i
            }
          }
          return c
        }
        if (
          (r.schema !== false && s.isSchema(e)) ||
          (r.ref !== false && i.isRef(e))
        ) {
          const n = r.each(e, { ...t, path: l, key: a })
          if (n === e) {
            return
          }
          return n
        }
        for (const n in e) {
          if (n[0] === '_') {
            continue
          }
          const s = o.scan(e[n], t, r, [n, ...l], a)
          if (s !== undefined) {
            c = c || Object.assign({}, e)
            c[n] = s
          }
        }
        return c
      }
    },
    5039: function (e, t, r) {
      const n = r(8309)
      const s = r(546)
      const i = r(6070)
      const o = r(7614)
      let a
      const l = {
        symbol: Symbol('ref'),
        defaults: {
          adjust: null,
          in: false,
          iterables: null,
          map: null,
          separator: '.',
          type: 'value',
        },
      }
      t.create = function (e, t = {}) {
        n(typeof e === 'string', 'Invalid reference key:', e)
        o.assertOptions(t, [
          'adjust',
          'ancestor',
          'in',
          'iterables',
          'map',
          'prefix',
          'separator',
        ])
        n(
          !t.prefix || typeof t.prefix === 'object',
          'options.prefix must be of type object'
        )
        const r = Object.assign({}, l.defaults, t)
        delete r.prefix
        const s = r.separator
        const i = l.context(e, s, t.prefix)
        r.type = i.type
        e = i.key
        if (r.type === 'value') {
          if (i.root) {
            n(!s || e[0] !== s, 'Cannot specify relative path with root prefix')
            r.ancestor = 'root'
            if (!e) {
              e = null
            }
          }
          if (s && s === e) {
            e = null
            r.ancestor = 0
          } else {
            if (r.ancestor !== undefined) {
              n(
                !s || !e || e[0] !== s,
                'Cannot combine prefix with ancestor option'
              )
            } else {
              const [t, n] = l.ancestor(e, s)
              if (n) {
                e = e.slice(n)
                if (e === '') {
                  e = null
                }
              }
              r.ancestor = t
            }
          }
        }
        r.path = s ? (e === null ? [] : e.split(s)) : [e]
        return new l.Ref(r)
      }
      t['in'] = function (e, r = {}) {
        return t.create(e, Object.assign({}, r, { in: true }))
      }
      t.isRef = function (e) {
        return e ? !!e[o.symbols.ref] : false
      }
      l.Ref = class {
        constructor(e) {
          n(typeof e === 'object', 'Invalid reference construction')
          o.assertOptions(e, [
            'adjust',
            'ancestor',
            'in',
            'iterables',
            'map',
            'path',
            'separator',
            'type',
            'depth',
            'key',
            'root',
            'display',
          ])
          n(
            [false, undefined].includes(e.separator) ||
              (typeof e.separator === 'string' && e.separator.length === 1),
            'Invalid separator'
          )
          n(
            !e.adjust || typeof e.adjust === 'function',
            'options.adjust must be a function'
          )
          n(!e.map || Array.isArray(e.map), 'options.map must be an array')
          n(!e.map || !e.adjust, 'Cannot set both map and adjust options')
          Object.assign(this, l.defaults, e)
          n(
            this.type === 'value' || this.ancestor === undefined,
            'Non-value references cannot reference ancestors'
          )
          if (Array.isArray(this.map)) {
            this.map = new Map(this.map)
          }
          this.depth = this.path.length
          this.key = this.path.length ? this.path.join(this.separator) : null
          this.root = this.path[0]
          this.updateDisplay()
        }
        resolve(e, t, r, s, i = {}) {
          n(!this.in || i.in, 'Invalid in() reference usage')
          if (this.type === 'global') {
            return this._resolve(r.context, t, i)
          }
          if (this.type === 'local') {
            return this._resolve(s, t, i)
          }
          if (!this.ancestor) {
            return this._resolve(e, t, i)
          }
          if (this.ancestor === 'root') {
            return this._resolve(t.ancestors[t.ancestors.length - 1], t, i)
          }
          n(
            this.ancestor <= t.ancestors.length,
            'Invalid reference exceeds the schema root:',
            this.display
          )
          return this._resolve(t.ancestors[this.ancestor - 1], t, i)
        }
        _resolve(e, t, r) {
          let n
          if (
            this.type === 'value' &&
            t.mainstay.shadow &&
            r.shadow !== false
          ) {
            n = t.mainstay.shadow.get(this.absolute(t))
          }
          if (n === undefined) {
            n = i(e, this.path, { iterables: this.iterables, functions: true })
          }
          if (this.adjust) {
            n = this.adjust(n)
          }
          if (this.map) {
            const e = this.map.get(n)
            if (e !== undefined) {
              n = e
            }
          }
          if (t.mainstay) {
            t.mainstay.tracer.resolve(t, this, n)
          }
          return n
        }
        toString() {
          return this.display
        }
        absolute(e) {
          return [...e.path.slice(0, -this.ancestor), ...this.path]
        }
        clone() {
          return new l.Ref(this)
        }
        describe() {
          const e = { path: this.path }
          if (this.type !== 'value') {
            e.type = this.type
          }
          if (this.separator !== '.') {
            e.separator = this.separator
          }
          if (this.type === 'value' && this.ancestor !== 1) {
            e.ancestor = this.ancestor
          }
          if (this.map) {
            e.map = [...this.map]
          }
          for (const t of ['adjust', 'iterables']) {
            if (this[t] !== null) {
              e[t] = this[t]
            }
          }
          if (this.in !== false) {
            e.in = true
          }
          return { ref: e }
        }
        updateDisplay() {
          const e = this.key !== null ? this.key : ''
          if (this.type !== 'value') {
            this.display = `ref:${this.type}:${e}`
            return
          }
          if (!this.separator) {
            this.display = `ref:${e}`
            return
          }
          if (!this.ancestor) {
            this.display = `ref:${this.separator}${e}`
            return
          }
          if (this.ancestor === 'root') {
            this.display = `ref:root:${e}`
            return
          }
          if (this.ancestor === 1) {
            this.display = `ref:${e || '..'}`
            return
          }
          const t = new Array(this.ancestor + 1).fill(this.separator).join('')
          this.display = `ref:${t}${e || ''}`
        }
      }
      l.Ref.prototype[o.symbols.ref] = true
      t.build = function (e) {
        e = Object.assign({}, l.defaults, e)
        if (e.type === 'value' && e.ancestor === undefined) {
          e.ancestor = 1
        }
        return new l.Ref(e)
      }
      l.context = function (e, t, r = {}) {
        e = e.trim()
        if (r) {
          const n = r.global === undefined ? '$' : r.global
          if (n !== t && e.startsWith(n)) {
            return { key: e.slice(n.length), type: 'global' }
          }
          const s = r.local === undefined ? '#' : r.local
          if (s !== t && e.startsWith(s)) {
            return { key: e.slice(s.length), type: 'local' }
          }
          const i = r.root === undefined ? '/' : r.root
          if (i !== t && e.startsWith(i)) {
            return { key: e.slice(i.length), type: 'value', root: true }
          }
        }
        return { key: e, type: 'value' }
      }
      l.ancestor = function (e, t) {
        if (!t) {
          return [1, 0]
        }
        if (e[0] !== t) {
          return [1, 0]
        }
        if (e[1] !== t) {
          return [0, 1]
        }
        let r = 2
        while (e[r] === t) {
          ++r
        }
        return [r - 1, r]
      }
      t.toSibling = 0
      t.toParent = 1
      t.Manager = class {
        constructor() {
          this.refs = []
        }
        register(e, n) {
          if (!e) {
            return
          }
          n = n === undefined ? t.toParent : n
          if (Array.isArray(e)) {
            for (const t of e) {
              this.register(t, n)
            }
            return
          }
          if (o.isSchema(e)) {
            for (const t of e._refs.refs) {
              if (t.ancestor - n >= 0) {
                this.refs.push({ ancestor: t.ancestor - n, root: t.root })
              }
            }
            return
          }
          if (t.isRef(e) && e.type === 'value' && e.ancestor - n >= 0) {
            this.refs.push({ ancestor: e.ancestor - n, root: e.root })
          }
          a = a || r(4823)
          if (a.isTemplate(e)) {
            this.register(e.refs(), n)
          }
        }
        get length() {
          return this.refs.length
        }
        clone() {
          const e = new t.Manager()
          e.refs = s(this.refs)
          return e
        }
        reset() {
          this.refs = []
        }
        roots() {
          return this.refs.filter((e) => !e.ancestor).map((e) => e.root)
        }
      }
    },
    5684: function (e, t, r) {
      const n = r(7268)
      const s = {}
      s.wrap = n.string().min(1).max(2).allow(false)
      t.preferences = n
        .object({
          allowUnknown: n.boolean(),
          abortEarly: n.boolean(),
          cache: n.boolean(),
          context: n.object(),
          convert: n.boolean(),
          dateFormat: n.valid('date', 'iso', 'string', 'time', 'utc'),
          debug: n.boolean(),
          errors: {
            escapeHtml: n.boolean(),
            label: n.valid('path', 'key', false),
            language: [n.string(), n.object().ref()],
            render: n.boolean(),
            stack: n.boolean(),
            wrap: { label: s.wrap, array: s.wrap },
          },
          externals: n.boolean(),
          messages: n.object(),
          noDefaults: n.boolean(),
          nonEnumerables: n.boolean(),
          presence: n.valid('required', 'optional', 'forbidden'),
          skipFunctions: n.boolean(),
          stripUnknown: n
            .object({ arrays: n.boolean(), objects: n.boolean() })
            .or('arrays', 'objects')
            .allow(true, false),
          warnings: n.boolean(),
        })
        .strict()
      s.nameRx = /^[a-zA-Z0-9]\w*$/
      s.rule = n.object({
        alias: n.array().items(n.string().pattern(s.nameRx)).single(),
        args: n
          .array()
          .items(
            n.string(),
            n.object({
              name: n.string().pattern(s.nameRx).required(),
              ref: n.boolean(),
              assert: n
                .alternatives([n.function(), n.object().schema()])
                .conditional('ref', { is: true, then: n.required() }),
              normalize: n.function(),
              message: n
                .string()
                .when('assert', { is: n.function(), then: n.required() }),
            })
          ),
        convert: n.boolean(),
        manifest: n.boolean(),
        method: n.function().allow(false),
        multi: n.boolean(),
        validate: n.function(),
      })
      t.extension = n
        .object({
          type: n.alternatives([n.string(), n.object().regex()]).required(),
          args: n.function(),
          base: n
            .object()
            .schema()
            .when('type', { is: n.object().regex(), then: n.forbidden() }),
          coerce: [
            n.function().maxArity(3),
            n.object({
              method: n.function().maxArity(3).required(),
              from: n.array().items(n.string()).single(),
            }),
          ],
          flags: n
            .object()
            .pattern(
              s.nameRx,
              n.object({ setter: n.string(), default: n.any() })
            ),
          manifest: { build: n.function().arity(2) },
          messages: [n.object(), n.string()],
          modifiers: n
            .object()
            .pattern(s.nameRx, n.function().minArity(1).maxArity(2)),
          overrides: n.object().pattern(s.nameRx, n.function()),
          prepare: n.function().maxArity(3),
          rebuild: n.function().arity(1),
          rules: n.object().pattern(s.nameRx, s.rule),
          terms: n
            .object()
            .pattern(
              s.nameRx,
              n.object({
                init: n.array().allow(null).required(),
                manifest: n
                  .object()
                  .pattern(/.+/, [
                    n.valid('schema', 'single'),
                    n.object({
                      mapped: n
                        .object({
                          from: n.string().required(),
                          to: n.string().required(),
                        })
                        .required(),
                    }),
                  ]),
              })
            ),
          validate: n.function().maxArity(3),
        })
        .strict()
      t.extensions = n.array().items(n.object(), n.function().arity(1)).strict()
      s.desc = {
        buffer: n.object({ buffer: n.string() }),
        func: n.object({
          function: n.function().required(),
          options: { literal: true },
        }),
        override: n.object({ override: true }),
        ref: n.object({
          ref: n
            .object({
              type: n.valid('value', 'global', 'local'),
              path: n.array().required(),
              separator: n.string().length(1).allow(false),
              ancestor: n.number().min(0).integer().allow('root'),
              map: n.array().items(n.array().length(2)).min(1),
              adjust: n.function(),
              iterables: n.boolean(),
              in: n.boolean(),
            })
            .required(),
        }),
        regex: n.object({ regex: n.string().min(3) }),
        special: n.object({ special: n.valid('deep').required() }),
        template: n.object({
          template: n.string().required(),
          options: n.object(),
        }),
        value: n.object({
          value: n.alternatives([n.object(), n.array()]).required(),
        }),
      }
      s.desc.entity = n.alternatives([
        n.array().items(n.link('...')),
        n.boolean(),
        n.function(),
        n.number(),
        n.string(),
        s.desc.buffer,
        s.desc.func,
        s.desc.ref,
        s.desc.regex,
        s.desc.special,
        s.desc.template,
        s.desc.value,
        n.link('/'),
      ])
      s.desc.values = n
        .array()
        .items(
          null,
          n.boolean(),
          n.function(),
          n.number().allow(Infinity, -Infinity),
          n.string().allow(''),
          n.symbol(),
          s.desc.buffer,
          s.desc.func,
          s.desc.override,
          s.desc.ref,
          s.desc.regex,
          s.desc.template,
          s.desc.value
        )
      s.desc.messages = n
        .object()
        .pattern(/.+/, [
          n.string(),
          s.desc.template,
          n.object().pattern(/.+/, [n.string(), s.desc.template]),
        ])
      t.description = n
        .object({
          type: n.string().required(),
          flags: n
            .object({
              cast: n.string(),
              default: n.any(),
              description: n.string(),
              empty: n.link('/'),
              failover: s.desc.entity,
              id: n.string(),
              label: n.string(),
              only: true,
              presence: ['optional', 'required', 'forbidden'],
              result: ['raw', 'strip'],
              strip: n.boolean(),
              unit: n.string(),
            })
            .unknown(),
          preferences: {
            allowUnknown: n.boolean(),
            abortEarly: n.boolean(),
            cache: n.boolean(),
            convert: n.boolean(),
            dateFormat: ['date', 'iso', 'string', 'time', 'utc'],
            errors: {
              escapeHtml: n.boolean(),
              label: ['path', 'key'],
              language: [n.string(), s.desc.ref],
              wrap: { label: s.wrap, array: s.wrap },
            },
            externals: n.boolean(),
            messages: s.desc.messages,
            noDefaults: n.boolean(),
            nonEnumerables: n.boolean(),
            presence: ['required', 'optional', 'forbidden'],
            skipFunctions: n.boolean(),
            stripUnknown: n
              .object({ arrays: n.boolean(), objects: n.boolean() })
              .or('arrays', 'objects')
              .allow(true, false),
            warnings: n.boolean(),
          },
          allow: s.desc.values,
          invalid: s.desc.values,
          rules: n
            .array()
            .min(1)
            .items({
              name: n.string().required(),
              args: n.object().min(1),
              keep: n.boolean(),
              message: [n.string(), s.desc.messages],
              warn: n.boolean(),
            }),
          keys: n.object().pattern(/.*/, n.link('/')),
          link: s.desc.ref,
        })
        .pattern(/^[a-z]\w*$/, n.any())
    },
    9720: function (e, t, r) {
      const n = r(546)
      const s = r(6070)
      const i = r(7614)
      const o = { value: Symbol('value') }
      e.exports = o.State = class {
        constructor(e, t, r) {
          this.path = e
          this.ancestors = t
          this.mainstay = r.mainstay
          this.schemas = r.schemas
          this.debug = null
        }
        localize(e, t = null, r = null) {
          const n = new o.State(e, t, this)
          if (r && n.schemas) {
            n.schemas = [o.schemas(r), ...n.schemas]
          }
          return n
        }
        nest(e, t) {
          const r = new o.State(this.path, this.ancestors, this)
          r.schemas = r.schemas && [o.schemas(e), ...r.schemas]
          r.debug = t
          return r
        }
        shadow(e, t) {
          this.mainstay.shadow = this.mainstay.shadow || new o.Shadow()
          this.mainstay.shadow.set(this.path, e, t)
        }
        snapshot() {
          if (this.mainstay.shadow) {
            this._snapshot = n(this.mainstay.shadow.node(this.path))
          }
        }
        restore() {
          if (this.mainstay.shadow) {
            this.mainstay.shadow.override(this.path, this._snapshot)
            this._snapshot = undefined
          }
        }
      }
      o.schemas = function (e) {
        if (i.isSchema(e)) {
          return { schema: e }
        }
        return e
      }
      o.Shadow = class {
        constructor() {
          this._values = null
        }
        set(e, t, r) {
          if (!e.length) {
            return
          }
          if (r === 'strip' && typeof e[e.length - 1] === 'number') {
            return
          }
          this._values = this._values || new Map()
          let n = this._values
          for (let t = 0; t < e.length; ++t) {
            const r = e[t]
            let s = n.get(r)
            if (!s) {
              s = new Map()
              n.set(r, s)
            }
            n = s
          }
          n[o.value] = t
        }
        get(e) {
          const t = this.node(e)
          if (t) {
            return t[o.value]
          }
        }
        node(e) {
          if (!this._values) {
            return
          }
          return s(this._values, e, { iterables: true })
        }
        override(e, t) {
          if (!this._values) {
            return
          }
          const r = e.slice(0, -1)
          const n = e[e.length - 1]
          const i = s(this._values, r, { iterables: true })
          if (t) {
            i.set(n, t)
            return
          }
          if (i) {
            i.delete(n)
          }
        }
      }
    },
    4823: function (e, t, r) {
      const n = r(8309)
      const s = r(546)
      const i = r(6339)
      const o = r(3105)
      const a = r(7614)
      const l = r(3377)
      const c = r(5039)
      const u = {
        symbol: Symbol('template'),
        opens: new Array(1e3).join('\0'),
        closes: new Array(1e3).join(''),
        dateFormat: {
          date: Date.prototype.toDateString,
          iso: Date.prototype.toISOString,
          string: Date.prototype.toString,
          time: Date.prototype.toTimeString,
          utc: Date.prototype.toUTCString,
        },
      }
      e.exports =
        t =
        u.Template =
          class {
            constructor(e, t) {
              n(typeof e === 'string', 'Template source must be a string')
              n(
                !e.includes('\0') && !e.includes(''),
                'Template source cannot contain reserved control characters'
              )
              this.source = e
              this.rendered = e
              this._template = null
              this._settings = s(t)
              this._parse()
            }
            _parse() {
              if (!this.source.includes('{')) {
                return
              }
              const e = u.encode(this.source)
              const t = u.split(e)
              let r = false
              const n = []
              const s = t.shift()
              if (s) {
                n.push(s)
              }
              for (const e of t) {
                const t = e[0] !== '{'
                const s = t ? '}' : '}}'
                const i = e.indexOf(s)
                if (i === -1 || e[1] === '{') {
                  n.push(`{${u.decode(e)}`)
                  continue
                }
                const o = e.slice(t ? 0 : 1, i)
                const a = this._ref(u.decode(o), t)
                n.push(a)
                if (typeof a !== 'string') {
                  r = true
                }
                const l = e.slice(i + s.length)
                if (l) {
                  n.push(u.decode(l))
                }
              }
              if (!r) {
                this.rendered = n.join('')
                return
              }
              this._template = n
            }
            static date(e, t) {
              return u.dateFormat[t.dateFormat].call(e)
            }
            describe(e = {}) {
              if (!this._settings && e.compact) {
                return this.source
              }
              const t = { template: this.source }
              if (this._settings) {
                t.options = this._settings
              }
              return t
            }
            static build(e) {
              return new u.Template(e.template, e.options)
            }
            isDynamic() {
              return !!this._template
            }
            static isTemplate(e) {
              return e ? !!e[a.symbols.template] : false
            }
            refs() {
              if (!this._template) {
                return
              }
              const e = []
              for (const t of this._template) {
                if (typeof t !== 'string') {
                  e.push(...t.refs)
                }
              }
              return e
            }
            resolve(e, t, r, n) {
              if (this._template && this._template.length === 1) {
                return this._part(this._template[0], e, t, r, n, {})
              }
              return this.render(e, t, r, n)
            }
            _part(e, ...t) {
              if (e.ref) {
                return e.ref.resolve(...t)
              }
              return e.formula.evaluate(t)
            }
            render(e, t, r, n, s = {}) {
              if (!this.isDynamic()) {
                return this.rendered
              }
              const o = []
              for (const a of this._template) {
                if (typeof a === 'string') {
                  o.push(a)
                } else {
                  const l = this._part(a, e, t, r, n, s)
                  const c = u.stringify(l, r, s.errors)
                  if (c !== undefined) {
                    const e =
                      a.raw || (s.errors && s.errors.escapeHtml) === false
                        ? c
                        : i(c)
                    const t =
                      a.ref &&
                      a.ref.type === 'local' &&
                      a.ref.key === 'label' &&
                      r.errors.wrap.label
                    o.push(u.wrap(e, t))
                  }
                }
              }
              return o.join('')
            }
            _ref(e, t) {
              const r = []
              const reference = (e) => {
                const t = c.create(e, this._settings)
                r.push(t)
                return (e) => t.resolve(...e)
              }
              try {
                var n = new o.Parser(e, {
                  reference: reference,
                  functions: u.functions,
                  constants: u.constants,
                })
              } catch (t) {
                t.message = `Invalid template variable "${e}" fails due to: ${t.message}`
                throw t
              }
              if (n.single) {
                if (n.single.type === 'reference') {
                  return { ref: r[0], raw: t, refs: r }
                }
                return u.stringify(n.single.value)
              }
              return { formula: n, raw: t, refs: r }
            }
            toString() {
              return this.source
            }
          }
      u.Template.prototype[a.symbols.template] = true
      u.Template.prototype.isImmutable = true
      u.encode = function (e) {
        return e
          .replace(/\\(\{+)/g, (e, t) => u.opens.slice(0, t.length))
          .replace(/\\(\}+)/g, (e, t) => u.closes.slice(0, t.length))
      }
      u.decode = function (e) {
        return e.replace(/\u0000/g, '{').replace(/\u0001/g, '}')
      }
      u.split = function (e) {
        const t = []
        let r = ''
        for (let n = 0; n < e.length; ++n) {
          const s = e[n]
          if (s === '{') {
            let s = ''
            while (n + 1 < e.length && e[n + 1] === '{') {
              s += '{'
              ++n
            }
            t.push(r)
            r = s
          } else {
            r += s
          }
        }
        t.push(r)
        return t
      }
      u.wrap = function (e, t) {
        if (!t) {
          return e
        }
        if (t.length === 1) {
          return `${t}${e}${t}`
        }
        return `${t[0]}${e}${t[1]}`
      }
      u.stringify = function (e, t, r) {
        const n = typeof e
        if (e === null) {
          return 'null'
        }
        if (n === 'string') {
          return e
        }
        if (n === 'number' || n === 'function' || n === 'symbol') {
          return e.toString()
        }
        if (n !== 'object') {
          return JSON.stringify(e)
        }
        if (e instanceof Date) {
          return u.Template.date(e, t)
        }
        if (e instanceof Map) {
          const t = []
          for (const [r, n] of e.entries()) {
            t.push(`${r.toString()} -> ${n.toString()}`)
          }
          e = t
        }
        if (!Array.isArray(e)) {
          return e.toString()
        }
        let s = ''
        for (const n of e) {
          s = s + (s.length ? ', ' : '') + u.stringify(n, t, r)
        }
        return u.wrap(s, t.errors.wrap.array)
      }
      u.constants = {
        true: true,
        false: false,
        null: null,
        second: 1e3,
        minute: 60 * 1e3,
        hour: 60 * 60 * 1e3,
        day: 24 * 60 * 60 * 1e3,
      }
      u.functions = {
        if(e, t, r) {
          return e ? t : r
        },
        msg(e) {
          const [t, r, n, s, i] = this
          const o = i.messages
          if (!o) {
            return ''
          }
          const a = l.template(t, o[0], e, r, n) || l.template(t, o[1], e, r, n)
          if (!a) {
            return ''
          }
          return a.render(t, r, n, s, i)
        },
        number(e) {
          if (typeof e === 'number') {
            return e
          }
          if (typeof e === 'string') {
            return parseFloat(e)
          }
          if (typeof e === 'boolean') {
            return e ? 1 : 0
          }
          if (e instanceof Date) {
            return e.getTime()
          }
          return null
        },
      }
    },
    1943: function (e, t, r) {
      const n = r(8130)
      const s = r(1287)
      const i = r(3377)
      const o = {
        codes: { error: 1, pass: 2, full: 3 },
        labels: { 0: 'never used', 1: 'always error', 2: 'always pass' },
      }
      t.setup = function (e) {
        const trace = function () {
          e._tracer = e._tracer || new o.Tracer()
          return e._tracer
        }
        e.trace = trace
        e[Symbol.for('@hapi/lab/coverage/initialize')] = trace
        e.untrace = () => {
          e._tracer = null
        }
      }
      t.location = function (e) {
        return e.$_setFlag('_tracerLocation', s.location(2))
      }
      o.Tracer = class {
        constructor() {
          this.name = 'Joi'
          this._schemas = new Map()
        }
        _register(e) {
          const t = this._schemas.get(e)
          if (t) {
            return t.store
          }
          const r = new o.Store(e)
          const { filename: n, line: i } =
            e._flags._tracerLocation || s.location(5)
          this._schemas.set(e, { filename: n, line: i, store: r })
          return r
        }
        _combine(e, t) {
          for (const { store: r } of this._schemas.values()) {
            r._combine(e, t)
          }
        }
        report(e) {
          const t = []
          for (const {
            filename: r,
            line: n,
            store: s,
          } of this._schemas.values()) {
            if (e && e !== r) {
              continue
            }
            const i = []
            const a = []
            for (const [e, t] of s._sources.entries()) {
              if (o.sub(t.paths, a)) {
                continue
              }
              if (!t.entry) {
                i.push({ status: 'never reached', paths: [...t.paths] })
                a.push(...t.paths)
                continue
              }
              for (const r of ['valid', 'invalid']) {
                const n = e[`_${r}s`]
                if (!n) {
                  continue
                }
                const s = new Set(n._values)
                const o = new Set(n._refs)
                for (const { value: e, ref: n } of t[r]) {
                  s.delete(e)
                  o.delete(n)
                }
                if (s.size || o.size) {
                  i.push({
                    status: [...s, ...[...o].map((e) => e.display)],
                    rule: `${r}s`,
                  })
                }
              }
              const r = e._rules.map((e) => e.name)
              for (const t of ['default', 'failover']) {
                if (e._flags[t] !== undefined) {
                  r.push(t)
                }
              }
              for (const e of r) {
                const r = o.labels[t.rule[e] || 0]
                if (r) {
                  const n = { rule: e, status: r }
                  if (t.paths.size) {
                    n.paths = [...t.paths]
                  }
                  i.push(n)
                }
              }
            }
            if (i.length) {
              t.push({
                filename: r,
                line: n,
                missing: i,
                severity: 'error',
                message: `Schema missing tests for ${i
                  .map(o.message)
                  .join(', ')}`,
              })
            }
          }
          return t.length ? t : null
        }
      }
      o.Store = class {
        constructor(e) {
          this.active = true
          this._sources = new Map()
          this._combos = new Map()
          this._scan(e)
        }
        debug(e, t, r, n) {
          e.mainstay.debug &&
            e.mainstay.debug.push({ type: t, name: r, result: n, path: e.path })
        }
        entry(e, t) {
          o.debug(t, { type: 'entry' })
          this._record(e, (e) => {
            e.entry = true
          })
        }
        filter(e, t, r, n) {
          o.debug(t, { type: r, ...n })
          this._record(e, (e) => {
            e[r].add(n)
          })
        }
        log(e, t, r, n, s) {
          o.debug(t, { type: r, name: n, result: s === 'full' ? 'pass' : s })
          this._record(e, (e) => {
            e[r][n] = e[r][n] || 0
            e[r][n] |= o.codes[s]
          })
        }
        resolve(e, t, r) {
          if (!e.mainstay.debug) {
            return
          }
          const n = { type: 'resolve', ref: t.display, to: r, path: e.path }
          e.mainstay.debug.push(n)
        }
        value(e, t, r, s, i) {
          if (!e.mainstay.debug || n(r, s)) {
            return
          }
          const o = { type: 'value', by: t, from: r, to: s, path: e.path }
          if (i) {
            o.name = i
          }
          e.mainstay.debug.push(o)
        }
        _record(e, t) {
          const r = this._sources.get(e)
          if (r) {
            t(r)
            return
          }
          const n = this._combos.get(e)
          for (const e of n) {
            this._record(e, t)
          }
        }
        _scan(e, t) {
          const r = t || []
          let n = this._sources.get(e)
          if (!n) {
            n = {
              paths: new Set(),
              entry: false,
              rule: {},
              valid: new Set(),
              invalid: new Set(),
            }
            this._sources.set(e, n)
          }
          if (r.length) {
            n.paths.add(r)
          }
          const each = (e, t) => {
            const n = o.id(e, t)
            this._scan(e, r.concat(n))
          }
          e.$_modify({ each: each, ref: false })
        }
        _combine(e, t) {
          this._combos.set(e, t)
        }
      }
      o.message = function (e) {
        const t = e.paths ? i.path(e.paths[0]) + (e.rule ? ':' : '') : ''
        return `${t}${e.rule || ''} (${e.status})`
      }
      o.id = function (e, { source: t, name: r, path: n, key: s }) {
        if (e._flags.id) {
          return e._flags.id
        }
        if (s) {
          return s
        }
        r = `@${r}`
        if (t === 'terms') {
          return [r, n[Math.min(n.length - 1, 1)]]
        }
        return r
      }
      o.sub = function (e, t) {
        for (const r of e) {
          for (const e of t) {
            if (n(r.slice(0, e.length), e)) {
              return true
            }
          }
        }
        return false
      }
      o.debug = function (e, t) {
        if (e.mainstay.debug) {
          t.path = e.debug ? [...e.path, e.debug] : e.path
          e.mainstay.debug.push(t)
        }
      }
    },
    1074: function (e, t, r) {
      const n = r(8309)
      const s = r(7379)
      const i = r(7614)
      const o = r(1039)
      const a = r(3377)
      const l = r(5039)
      const c = {}
      e.exports = s.extend({
        type: 'alternatives',
        flags: { match: { default: 'any' } },
        terms: { matches: { init: [], register: l.toSibling } },
        args(e, ...t) {
          if (t.length === 1) {
            if (Array.isArray(t[0])) {
              return e.try(...t[0])
            }
          }
          return e.try(...t)
        },
        validate(e, t) {
          const { schema: r, error: n, state: s, prefs: i } = t
          if (r._flags.match) {
            let t = 0
            let o
            for (let n = 0; n < r.$_terms.matches.length; ++n) {
              const a = r.$_terms.matches[n]
              const l = s.nest(a.schema, `match.${n}`)
              l.snapshot()
              const c = a.schema.$_validate(e, l, i)
              if (!c.errors) {
                ++t
                o = c.value
              } else {
                l.restore()
              }
            }
            if (!t) {
              return { errors: n('alternatives.any') }
            }
            if (r._flags.match === 'one') {
              return t === 1 ? { value: o } : { errors: n('alternatives.one') }
            }
            return t === r.$_terms.matches.length
              ? { value: e }
              : { errors: n('alternatives.all') }
          }
          const o = []
          for (let t = 0; t < r.$_terms.matches.length; ++t) {
            const n = r.$_terms.matches[t]
            if (n.schema) {
              const r = s.nest(n.schema, `match.${t}`)
              r.snapshot()
              const a = n.schema.$_validate(e, r, i)
              if (!a.errors) {
                return a
              }
              r.restore()
              o.push({ schema: n.schema, reports: a.errors })
              continue
            }
            const a = n.ref ? n.ref.resolve(e, s, i) : e
            const l = n.is ? [n] : n.switch
            for (let r = 0; r < l.length; ++r) {
              const o = l[r]
              const { is: c, then: u, otherwise: f } = o
              const d = `match.${t}${n.switch ? '.' + r : ''}`
              if (!c.$_match(a, s.nest(c, `${d}.is`), i)) {
                if (f) {
                  return f.$_validate(e, s.nest(f, `${d}.otherwise`), i)
                }
              } else if (u) {
                return u.$_validate(e, s.nest(u, `${d}.then`), i)
              }
            }
          }
          return c.errors(o, t)
        },
        rules: {
          conditional: {
            method(e, t) {
              n(!this._flags._endedSwitch, 'Unreachable condition')
              n(
                !this._flags.match,
                'Cannot combine match mode',
                this._flags.match,
                'with conditional rule'
              )
              n(
                t.break === undefined,
                'Cannot use break option with alternatives conditional'
              )
              const r = this.clone()
              const s = o.when(r, e, t)
              const i = s.is ? [s] : s.switch
              for (const e of i) {
                if (e.then && e.otherwise) {
                  r.$_setFlag('_endedSwitch', true, { clone: false })
                  break
                }
              }
              r.$_terms.matches.push(s)
              return r.$_mutateRebuild()
            },
          },
          match: {
            method(e) {
              n(
                ['any', 'one', 'all'].includes(e),
                'Invalid alternatives match mode',
                e
              )
              if (e !== 'any') {
                for (const t of this.$_terms.matches) {
                  n(
                    t.schema,
                    'Cannot combine match mode',
                    e,
                    'with conditional rules'
                  )
                }
              }
              return this.$_setFlag('match', e)
            },
          },
          try: {
            method(...e) {
              n(e.length, 'Missing alternative schemas')
              i.verifyFlat(e, 'try')
              n(!this._flags._endedSwitch, 'Unreachable condition')
              const t = this.clone()
              for (const r of e) {
                t.$_terms.matches.push({ schema: t.$_compile(r) })
              }
              return t.$_mutateRebuild()
            },
          },
        },
        overrides: {
          label(e) {
            const t = this.$_super.label(e)
            const each = (t, r) => (r.path[0] !== 'is' ? t.label(e) : undefined)
            return t.$_modify({ each: each, ref: false })
          },
        },
        rebuild(e) {
          const each = (t) => {
            if (i.isSchema(t) && t.type === 'array') {
              e.$_setFlag('_arrayItems', true, { clone: false })
            }
          }
          e.$_modify({ each: each })
        },
        manifest: {
          build(e, t) {
            if (t.matches) {
              for (const r of t.matches) {
                const {
                  schema: t,
                  ref: n,
                  is: s,
                  not: i,
                  then: o,
                  otherwise: a,
                } = r
                if (t) {
                  e = e.try(t)
                } else if (n) {
                  e = e.conditional(n, {
                    is: s,
                    then: o,
                    not: i,
                    otherwise: a,
                    switch: r.switch,
                  })
                } else {
                  e = e.conditional(s, { then: o, otherwise: a })
                }
              }
            }
            return e
          },
        },
        messages: {
          'alternatives.all':
            '{{#label}} does not match all of the required types',
          'alternatives.any':
            '{{#label}} does not match any of the allowed types',
          'alternatives.match':
            '{{#label}} does not match any of the allowed types',
          'alternatives.one': '{{#label}} matches more than one allowed type',
          'alternatives.types': '{{#label}} must be one of {{#types}}',
        },
      })
      c.errors = function (e, { error: t, state: r }) {
        if (!e.length) {
          return { errors: t('alternatives.any') }
        }
        if (e.length === 1) {
          return { errors: e[0].reports }
        }
        const n = new Set()
        const s = []
        for (const { reports: i, schema: o } of e) {
          if (i.length > 1) {
            return c.unmatched(e, t)
          }
          const l = i[0]
          if (l instanceof a.Report === false) {
            return c.unmatched(e, t)
          }
          if (l.state.path.length !== r.path.length) {
            s.push({ type: o.type, report: l })
            continue
          }
          if (l.code === 'any.only') {
            for (const e of l.local.valids) {
              n.add(e)
            }
            continue
          }
          const [u, f] = l.code.split('.')
          if (f !== 'base') {
            s.push({ type: o.type, report: l })
            continue
          }
          n.add(u)
        }
        if (!s.length) {
          return { errors: t('alternatives.types', { types: [...n] }) }
        }
        if (s.length === 1) {
          return { errors: s[0].report }
        }
        return c.unmatched(e, t)
      }
      c.unmatched = function (e, t) {
        const r = []
        for (const t of e) {
          r.push(...t.reports)
        }
        return {
          errors: t('alternatives.match', a.details(r, { override: false })),
        }
      }
    },
    7379: function (e, t, r) {
      const n = r(8309)
      const s = r(5530)
      const i = r(7614)
      const o = r(7889)
      const a = {}
      e.exports = s.extend({
        type: 'any',
        flags: { only: { default: false } },
        terms: {
          alterations: { init: null },
          examples: { init: null },
          externals: { init: null },
          metas: { init: [] },
          notes: { init: [] },
          shared: { init: null },
          tags: { init: [] },
          whens: { init: null },
        },
        rules: {
          custom: {
            method(e, t) {
              n(typeof e === 'function', 'Method must be a function')
              n(
                t === undefined || (t && typeof t === 'string'),
                'Description must be a non-empty string'
              )
              return this.$_addRule({
                name: 'custom',
                args: { method: e, description: t },
              })
            },
            validate(e, t, { method: r }) {
              try {
                return r(e, t)
              } catch (e) {
                return t.error('any.custom', { error: e })
              }
            },
            args: ['method', 'description'],
            multi: true,
          },
          messages: {
            method(e) {
              return this.prefs({ messages: e })
            },
          },
          shared: {
            method(e) {
              n(
                i.isSchema(e) && e._flags.id,
                'Schema must be a schema with an id'
              )
              const t = this.clone()
              t.$_terms.shared = t.$_terms.shared || []
              t.$_terms.shared.push(e)
              t.$_mutateRegister(e)
              return t
            },
          },
          warning: {
            method(e, t) {
              n(e && typeof e === 'string', 'Invalid warning code')
              return this.$_addRule({
                name: 'warning',
                args: { code: e, local: t },
                warn: true,
              })
            },
            validate(e, t, { code: r, local: n }) {
              return t.error(r, n)
            },
            args: ['code', 'local'],
            multi: true,
          },
        },
        modifiers: {
          keep(e, t = true) {
            e.keep = t
          },
          message(e, t) {
            e.message = o.compile(t)
          },
          warn(e, t = true) {
            e.warn = t
          },
        },
        manifest: {
          build(e, t) {
            for (const r in t) {
              const n = t[r]
              if (
                ['examples', 'externals', 'metas', 'notes', 'tags'].includes(r)
              ) {
                for (const t of n) {
                  e = e[r.slice(0, -1)](t)
                }
                continue
              }
              if (r === 'alterations') {
                const t = {}
                for (const { target: e, adjuster: r } of n) {
                  t[e] = r
                }
                e = e.alter(t)
                continue
              }
              if (r === 'whens') {
                for (const t of n) {
                  const {
                    ref: r,
                    is: n,
                    not: s,
                    then: i,
                    otherwise: o,
                    concat: a,
                  } = t
                  if (a) {
                    e = e.concat(a)
                  } else if (r) {
                    e = e.when(r, {
                      is: n,
                      not: s,
                      then: i,
                      otherwise: o,
                      switch: t.switch,
                      break: t.break,
                    })
                  } else {
                    e = e.when(n, { then: i, otherwise: o, break: t.break })
                  }
                }
                continue
              }
              if (r === 'shared') {
                for (const t of n) {
                  e = e.shared(t)
                }
              }
            }
            return e
          },
        },
        messages: {
          'any.custom':
            '{{#label}} failed custom validation because {{#error.message}}',
          'any.default':
            '{{#label}} threw an error when running default method',
          'any.failover':
            '{{#label}} threw an error when running failover method',
          'any.invalid': '{{#label}} contains an invalid value',
          'any.only':
            '{{#label}} must be {if(#valids.length == 1, "", "one of ")}{{#valids}}',
          'any.ref':
            '{{#label}} {{#arg}} references "{{#ref}}" which {{#reason}}',
          'any.required': '{{#label}} is required',
          'any.unknown': '{{#label}} is not allowed',
        },
      })
    },
    9920: function (e, t, r) {
      const n = r(8309)
      const s = r(8130)
      const i = r(6070)
      const o = r(7379)
      const a = r(7614)
      const l = r(1039)
      const c = {}
      e.exports = o.extend({
        type: 'array',
        flags: { single: { default: false }, sparse: { default: false } },
        terms: {
          items: { init: [], manifest: 'schema' },
          ordered: { init: [], manifest: 'schema' },
          _exclusions: { init: [] },
          _inclusions: { init: [] },
          _requireds: { init: [] },
        },
        coerce: {
          from: 'object',
          method(e, { schema: t, state: r, prefs: n }) {
            if (!Array.isArray(e)) {
              return
            }
            const s = t.$_getRule('sort')
            if (!s) {
              return
            }
            return c.sort(t, e, s.args.options, r, n)
          },
        },
        validate(e, { schema: t, error: r }) {
          if (!Array.isArray(e)) {
            if (t._flags.single) {
              const t = [e]
              t[a.symbols.arraySingle] = true
              return { value: t }
            }
            return { errors: r('array.base') }
          }
          if (!t.$_getRule('items') && !t.$_terms.externals) {
            return
          }
          return { value: e.slice() }
        },
        rules: {
          has: {
            method(e) {
              e = this.$_compile(e, { appendPath: true })
              const t = this.$_addRule({ name: 'has', args: { schema: e } })
              t.$_mutateRegister(e)
              return t
            },
            validate(e, { state: t, prefs: r, error: n }, { schema: s }) {
              const i = [e, ...t.ancestors]
              for (let n = 0; n < e.length; ++n) {
                const o = t.localize([...t.path, n], i, s)
                if (s.$_match(e[n], o, r)) {
                  return e
                }
              }
              const o = s._flags.label
              if (o) {
                return n('array.hasKnown', { patternLabel: o })
              }
              return n('array.hasUnknown', null)
            },
            multi: true,
          },
          items: {
            method(...e) {
              a.verifyFlat(e, 'items')
              const t = this.$_addRule('items')
              for (let r = 0; r < e.length; ++r) {
                const n = a.tryWithPath(() => this.$_compile(e[r]), r, {
                  append: true,
                })
                t.$_terms.items.push(n)
              }
              return t.$_mutateRebuild()
            },
            validate(e, { schema: t, error: r, state: n, prefs: s }) {
              const i = t.$_terms._requireds.slice()
              const o = t.$_terms.ordered.slice()
              const l = [...t.$_terms._inclusions, ...i]
              const u = !e[a.symbols.arraySingle]
              delete e[a.symbols.arraySingle]
              const f = []
              let d = e.length
              for (let a = 0; a < d; ++a) {
                const m = e[a]
                let h = false
                let p = false
                const g = u ? a : new Number(a)
                const y = [...n.path, g]
                if (!t._flags.sparse && m === undefined) {
                  f.push(
                    r(
                      'array.sparse',
                      { key: g, path: y, pos: a, value: undefined },
                      n.localize(y)
                    )
                  )
                  if (s.abortEarly) {
                    return f
                  }
                  o.shift()
                  continue
                }
                const b = [e, ...n.ancestors]
                for (const e of t.$_terms._exclusions) {
                  if (
                    !e.$_match(m, n.localize(y, b, e), s, {
                      presence: 'ignore',
                    })
                  ) {
                    continue
                  }
                  f.push(
                    r('array.excludes', { pos: a, value: m }, n.localize(y))
                  )
                  if (s.abortEarly) {
                    return f
                  }
                  h = true
                  o.shift()
                  break
                }
                if (h) {
                  continue
                }
                if (t.$_terms.ordered.length) {
                  if (o.length) {
                    const i = o.shift()
                    const l = i.$_validate(m, n.localize(y, b, i), s)
                    if (!l.errors) {
                      if (i._flags.result === 'strip') {
                        c.fastSplice(e, a)
                        --a
                        --d
                      } else if (!t._flags.sparse && l.value === undefined) {
                        f.push(
                          r(
                            'array.sparse',
                            { key: g, path: y, pos: a, value: undefined },
                            n.localize(y)
                          )
                        )
                        if (s.abortEarly) {
                          return f
                        }
                        continue
                      } else {
                        e[a] = l.value
                      }
                    } else {
                      f.push(...l.errors)
                      if (s.abortEarly) {
                        return f
                      }
                    }
                    continue
                  } else if (!t.$_terms.items.length) {
                    f.push(
                      r('array.orderedLength', {
                        pos: a,
                        limit: t.$_terms.ordered.length,
                      })
                    )
                    if (s.abortEarly) {
                      return f
                    }
                    break
                  }
                }
                const _ = []
                let A = i.length
                for (let o = 0; o < A; ++o) {
                  const l = n.localize(y, b, i[o])
                  l.snapshot()
                  const u = i[o].$_validate(m, l, s)
                  _[o] = u
                  if (!u.errors) {
                    e[a] = u.value
                    p = true
                    c.fastSplice(i, o)
                    --o
                    --A
                    if (!t._flags.sparse && u.value === undefined) {
                      f.push(
                        r(
                          'array.sparse',
                          { key: g, path: y, pos: a, value: undefined },
                          n.localize(y)
                        )
                      )
                      if (s.abortEarly) {
                        return f
                      }
                    }
                    break
                  }
                  l.restore()
                }
                if (p) {
                  continue
                }
                const v = (s.stripUnknown && !!s.stripUnknown.arrays) || false
                A = l.length
                for (const o of l) {
                  let l
                  const u = i.indexOf(o)
                  if (u !== -1) {
                    l = _[u]
                  } else {
                    const i = n.localize(y, b, o)
                    i.snapshot()
                    l = o.$_validate(m, i, s)
                    if (!l.errors) {
                      if (o._flags.result === 'strip') {
                        c.fastSplice(e, a)
                        --a
                        --d
                      } else if (!t._flags.sparse && l.value === undefined) {
                        f.push(
                          r(
                            'array.sparse',
                            { key: g, path: y, pos: a, value: undefined },
                            n.localize(y)
                          )
                        )
                        h = true
                      } else {
                        e[a] = l.value
                      }
                      p = true
                      break
                    }
                    i.restore()
                  }
                  if (A === 1) {
                    if (v) {
                      c.fastSplice(e, a)
                      --a
                      --d
                      p = true
                      break
                    }
                    f.push(...l.errors)
                    if (s.abortEarly) {
                      return f
                    }
                    h = true
                    break
                  }
                }
                if (h) {
                  continue
                }
                if (t.$_terms._inclusions.length && !p) {
                  if (v) {
                    c.fastSplice(e, a)
                    --a
                    --d
                    continue
                  }
                  f.push(
                    r('array.includes', { pos: a, value: m }, n.localize(y))
                  )
                  if (s.abortEarly) {
                    return f
                  }
                }
              }
              if (i.length) {
                c.fillMissedErrors(t, f, i, e, n, s)
              }
              if (o.length) {
                c.fillOrderedErrors(t, f, o, e, n, s)
              }
              return f.length ? f : e
            },
            priority: true,
            manifest: false,
          },
          length: {
            method(e) {
              return this.$_addRule({
                name: 'length',
                args: { limit: e },
                operator: '=',
              })
            },
            validate(e, t, { limit: r }, { name: n, operator: s, args: i }) {
              if (a.compare(e.length, r, s)) {
                return e
              }
              return t.error('array.' + n, { limit: i.limit, value: e })
            },
            args: [
              {
                name: 'limit',
                ref: true,
                assert: a.limit,
                message: 'must be a positive integer',
              },
            ],
          },
          max: {
            method(e) {
              return this.$_addRule({
                name: 'max',
                method: 'length',
                args: { limit: e },
                operator: '<=',
              })
            },
          },
          min: {
            method(e) {
              return this.$_addRule({
                name: 'min',
                method: 'length',
                args: { limit: e },
                operator: '>=',
              })
            },
          },
          ordered: {
            method(...e) {
              a.verifyFlat(e, 'ordered')
              const t = this.$_addRule('items')
              for (let r = 0; r < e.length; ++r) {
                const n = a.tryWithPath(() => this.$_compile(e[r]), r, {
                  append: true,
                })
                c.validateSingle(n, t)
                t.$_mutateRegister(n)
                t.$_terms.ordered.push(n)
              }
              return t.$_mutateRebuild()
            },
          },
          single: {
            method(e) {
              const t = e === undefined ? true : !!e
              n(
                !t || !this._flags._arrayItems,
                'Cannot specify single rule when array has array items'
              )
              return this.$_setFlag('single', t)
            },
          },
          sort: {
            method(e = {}) {
              a.assertOptions(e, ['by', 'order'])
              const t = { order: e.order || 'ascending' }
              if (e.by) {
                t.by = l.ref(e.by, { ancestor: 0 })
                n(!t.by.ancestor, 'Cannot sort by ancestor')
              }
              return this.$_addRule({ name: 'sort', args: { options: t } })
            },
            validate(
              e,
              { error: t, state: r, prefs: n, schema: s },
              { options: i }
            ) {
              const { value: o, errors: a } = c.sort(s, e, i, r, n)
              if (a) {
                return a
              }
              for (let r = 0; r < e.length; ++r) {
                if (e[r] !== o[r]) {
                  return t('array.sort', {
                    order: i.order,
                    by: i.by ? i.by.key : 'value',
                  })
                }
              }
              return e
            },
            convert: true,
          },
          sparse: {
            method(e) {
              const t = e === undefined ? true : !!e
              if (this._flags.sparse === t) {
                return this
              }
              const r = t ? this.clone() : this.$_addRule('items')
              return r.$_setFlag('sparse', t, { clone: false })
            },
          },
          unique: {
            method(e, t = {}) {
              n(
                !e || typeof e === 'function' || typeof e === 'string',
                'comparator must be a function or a string'
              )
              a.assertOptions(t, ['ignoreUndefined', 'separator'])
              const r = { name: 'unique', args: { options: t, comparator: e } }
              if (e) {
                if (typeof e === 'string') {
                  const n = a.default(t.separator, '.')
                  r.path = n ? e.split(n) : [e]
                } else {
                  r.comparator = e
                }
              }
              return this.$_addRule(r)
            },
            validate(
              e,
              { state: t, error: r, schema: o },
              { comparator: a, options: l },
              { comparator: c, path: u }
            ) {
              const f = {
                string: Object.create(null),
                number: Object.create(null),
                undefined: Object.create(null),
                boolean: Object.create(null),
                object: new Map(),
                function: new Map(),
                custom: new Map(),
              }
              const d = c || s
              const m = l.ignoreUndefined
              for (let s = 0; s < e.length; ++s) {
                const o = u ? i(e[s], u) : e[s]
                const l = c ? f.custom : f[typeof o]
                n(l, 'Failed to find unique map container for type', typeof o)
                if (l instanceof Map) {
                  const n = l.entries()
                  let i
                  while (!(i = n.next()).done) {
                    if (d(i.value[0], o)) {
                      const n = t.localize([...t.path, s], [e, ...t.ancestors])
                      const o = {
                        pos: s,
                        value: e[s],
                        dupePos: i.value[1],
                        dupeValue: e[i.value[1]],
                      }
                      if (u) {
                        o.path = a
                      }
                      return r('array.unique', o, n)
                    }
                  }
                  l.set(o, s)
                } else {
                  if ((!m || o !== undefined) && l[o] !== undefined) {
                    const n = {
                      pos: s,
                      value: e[s],
                      dupePos: l[o],
                      dupeValue: e[l[o]],
                    }
                    if (u) {
                      n.path = a
                    }
                    const i = t.localize([...t.path, s], [e, ...t.ancestors])
                    return r('array.unique', n, i)
                  }
                  l[o] = s
                }
              }
              return e
            },
            args: ['comparator', 'options'],
            multi: true,
          },
        },
        cast: {
          set: {
            from: Array.isArray,
            to(e, t) {
              return new Set(e)
            },
          },
        },
        rebuild(e) {
          e.$_terms._inclusions = []
          e.$_terms._exclusions = []
          e.$_terms._requireds = []
          for (const t of e.$_terms.items) {
            c.validateSingle(t, e)
            if (t._flags.presence === 'required') {
              e.$_terms._requireds.push(t)
            } else if (t._flags.presence === 'forbidden') {
              e.$_terms._exclusions.push(t)
            } else {
              e.$_terms._inclusions.push(t)
            }
          }
          for (const t of e.$_terms.ordered) {
            c.validateSingle(t, e)
          }
        },
        manifest: {
          build(e, t) {
            if (t.items) {
              e = e.items(...t.items)
            }
            if (t.ordered) {
              e = e.ordered(...t.ordered)
            }
            return e
          },
        },
        messages: {
          'array.base': '{{#label}} must be an array',
          'array.excludes': '{{#label}} contains an excluded value',
          'array.hasKnown':
            '{{#label}} does not contain at least one required match for type "{#patternLabel}"',
          'array.hasUnknown':
            '{{#label}} does not contain at least one required match',
          'array.includes':
            '{{#label}} does not match any of the allowed types',
          'array.includesRequiredBoth':
            '{{#label}} does not contain {{#knownMisses}} and {{#unknownMisses}} other required value(s)',
          'array.includesRequiredKnowns':
            '{{#label}} does not contain {{#knownMisses}}',
          'array.includesRequiredUnknowns':
            '{{#label}} does not contain {{#unknownMisses}} required value(s)',
          'array.length': '{{#label}} must contain {{#limit}} items',
          'array.max':
            '{{#label}} must contain less than or equal to {{#limit}} items',
          'array.min': '{{#label}} must contain at least {{#limit}} items',
          'array.orderedLength':
            '{{#label}} must contain at most {{#limit}} items',
          'array.sort':
            '{{#label}} must be sorted in {#order} order by {{#by}}',
          'array.sort.mismatching':
            '{{#label}} cannot be sorted due to mismatching types',
          'array.sort.unsupported':
            '{{#label}} cannot be sorted due to unsupported type {#type}',
          'array.sparse': '{{#label}} must not be a sparse array item',
          'array.unique': '{{#label}} contains a duplicate value',
        },
      })
      c.fillMissedErrors = function (e, t, r, n, s, i) {
        const o = []
        let a = 0
        for (const e of r) {
          const t = e._flags.label
          if (t) {
            o.push(t)
          } else {
            ++a
          }
        }
        if (o.length) {
          if (a) {
            t.push(
              e.$_createError(
                'array.includesRequiredBoth',
                n,
                { knownMisses: o, unknownMisses: a },
                s,
                i
              )
            )
          } else {
            t.push(
              e.$_createError(
                'array.includesRequiredKnowns',
                n,
                { knownMisses: o },
                s,
                i
              )
            )
          }
        } else {
          t.push(
            e.$_createError(
              'array.includesRequiredUnknowns',
              n,
              { unknownMisses: a },
              s,
              i
            )
          )
        }
      }
      c.fillOrderedErrors = function (e, t, r, n, s, i) {
        const o = []
        for (const e of r) {
          if (e._flags.presence === 'required') {
            o.push(e)
          }
        }
        if (o.length) {
          c.fillMissedErrors(e, t, o, n, s, i)
        }
      }
      c.fastSplice = function (e, t) {
        let r = t
        while (r < e.length) {
          e[r++] = e[r]
        }
        --e.length
      }
      c.validateSingle = function (e, t) {
        if (e.type === 'array' || e._flags._arrayItems) {
          n(
            !t._flags.single,
            'Cannot specify array item with single rule enabled'
          )
          t.$_setFlag('_arrayItems', true, { clone: false })
        }
      }
      c.sort = function (e, t, r, n, s) {
        const i = r.order === 'ascending' ? 1 : -1
        const o = -1 * i
        const a = i
        const sort = (l, u) => {
          let f = c.compare(l, u, o, a)
          if (f !== null) {
            return f
          }
          if (r.by) {
            l = r.by.resolve(l, n, s)
            u = r.by.resolve(u, n, s)
          }
          f = c.compare(l, u, o, a)
          if (f !== null) {
            return f
          }
          const d = typeof l
          if (d !== typeof u) {
            throw e.$_createError('array.sort.mismatching', t, null, n, s)
          }
          if (d !== 'number' && d !== 'string') {
            throw e.$_createError(
              'array.sort.unsupported',
              t,
              { type: d },
              n,
              s
            )
          }
          if (d === 'number') {
            return (l - u) * i
          }
          return l < u ? o : a
        }
        try {
          return { value: t.slice().sort(sort) }
        } catch (e) {
          return { errors: e }
        }
      }
      c.compare = function (e, t, r, n) {
        if (e === t) {
          return 0
        }
        if (e === undefined) {
          return 1
        }
        if (t === undefined) {
          return -1
        }
        if (e === null) {
          return n
        }
        if (t === null) {
          return r
        }
        return null
      }
    },
    5548: function (e, t, r) {
      const n = r(8309)
      const s = r(7379)
      const i = r(7614)
      const o = {}
      e.exports = s.extend({
        type: 'binary',
        coerce: {
          from: 'string',
          method(e, { schema: t }) {
            try {
              return { value: Buffer.from(e, t._flags.encoding) }
            } catch (e) {}
          },
        },
        validate(e, { error: t }) {
          if (!Buffer.isBuffer(e)) {
            return { value: e, errors: t('binary.base') }
          }
        },
        rules: {
          encoding: {
            method(e) {
              n(Buffer.isEncoding(e), 'Invalid encoding:', e)
              return this.$_setFlag('encoding', e)
            },
          },
          length: {
            method(e) {
              return this.$_addRule({
                name: 'length',
                method: 'length',
                args: { limit: e },
                operator: '=',
              })
            },
            validate(e, t, { limit: r }, { name: n, operator: s, args: o }) {
              if (i.compare(e.length, r, s)) {
                return e
              }
              return t.error('binary.' + n, { limit: o.limit, value: e })
            },
            args: [
              {
                name: 'limit',
                ref: true,
                assert: i.limit,
                message: 'must be a positive integer',
              },
            ],
          },
          max: {
            method(e) {
              return this.$_addRule({
                name: 'max',
                method: 'length',
                args: { limit: e },
                operator: '<=',
              })
            },
          },
          min: {
            method(e) {
              return this.$_addRule({
                name: 'min',
                method: 'length',
                args: { limit: e },
                operator: '>=',
              })
            },
          },
        },
        cast: {
          string: {
            from: (e) => Buffer.isBuffer(e),
            to(e, t) {
              return e.toString()
            },
          },
        },
        messages: {
          'binary.base': '{{#label}} must be a buffer or a string',
          'binary.length': '{{#label}} must be {{#limit}} bytes',
          'binary.max':
            '{{#label}} must be less than or equal to {{#limit}} bytes',
          'binary.min': '{{#label}} must be at least {{#limit}} bytes',
        },
      })
    },
    3748: function (e, t, r) {
      const n = r(8309)
      const s = r(7379)
      const i = r(7614)
      const o = r(3054)
      const a = {}
      a.isBool = function (e) {
        return typeof e === 'boolean'
      }
      e.exports = s.extend({
        type: 'boolean',
        flags: { sensitive: { default: false } },
        terms: {
          falsy: { init: null, manifest: 'values' },
          truthy: { init: null, manifest: 'values' },
        },
        coerce(e, { schema: t }) {
          if (typeof e === 'boolean') {
            return
          }
          if (typeof e === 'string') {
            const r = t._flags.sensitive ? e : e.toLowerCase()
            e = r === 'true' ? true : r === 'false' ? false : e
          }
          if (typeof e !== 'boolean') {
            e =
              (t.$_terms.truthy &&
                t.$_terms.truthy.has(e, null, null, !t._flags.sensitive)) ||
              (t.$_terms.falsy &&
              t.$_terms.falsy.has(e, null, null, !t._flags.sensitive)
                ? false
                : e)
          }
          return { value: e }
        },
        validate(e, { error: t }) {
          if (typeof e !== 'boolean') {
            return { value: e, errors: t('boolean.base') }
          }
        },
        rules: {
          truthy: {
            method(...e) {
              i.verifyFlat(e, 'truthy')
              const t = this.clone()
              t.$_terms.truthy = t.$_terms.truthy || new o()
              for (let r = 0; r < e.length; ++r) {
                const s = e[r]
                n(s !== undefined, 'Cannot call truthy with undefined')
                t.$_terms.truthy.add(s)
              }
              return t
            },
          },
          falsy: {
            method(...e) {
              i.verifyFlat(e, 'falsy')
              const t = this.clone()
              t.$_terms.falsy = t.$_terms.falsy || new o()
              for (let r = 0; r < e.length; ++r) {
                const s = e[r]
                n(s !== undefined, 'Cannot call falsy with undefined')
                t.$_terms.falsy.add(s)
              }
              return t
            },
          },
          sensitive: {
            method(e = true) {
              return this.$_setFlag('sensitive', e)
            },
          },
        },
        cast: {
          number: {
            from: a.isBool,
            to(e, t) {
              return e ? 1 : 0
            },
          },
          string: {
            from: a.isBool,
            to(e, t) {
              return e ? 'true' : 'false'
            },
          },
        },
        manifest: {
          build(e, t) {
            if (t.truthy) {
              e = e.truthy(...t.truthy)
            }
            if (t.falsy) {
              e = e.falsy(...t.falsy)
            }
            return e
          },
        },
        messages: { 'boolean.base': '{{#label}} must be a boolean' },
      })
    },
    3223: function (e, t, r) {
      const n = r(8309)
      const s = r(7379)
      const i = r(7614)
      const o = r(4823)
      const a = {}
      a.isDate = function (e) {
        return e instanceof Date
      }
      e.exports = s.extend({
        type: 'date',
        coerce: {
          from: ['number', 'string'],
          method(e, { schema: t }) {
            return { value: a.parse(e, t._flags.format) || e }
          },
        },
        validate(e, { schema: t, error: r, prefs: n }) {
          if (e instanceof Date && !isNaN(e.getTime())) {
            return
          }
          const s = t._flags.format
          if (!n.convert || !s || typeof e !== 'string') {
            return { value: e, errors: r('date.base') }
          }
          return { value: e, errors: r('date.format', { format: s }) }
        },
        rules: {
          compare: {
            method: false,
            validate(e, t, { date: r }, { name: n, operator: s, args: o }) {
              const a = r === 'now' ? Date.now() : r.getTime()
              if (i.compare(e.getTime(), a, s)) {
                return e
              }
              return t.error('date.' + n, { limit: o.date, value: e })
            },
            args: [
              {
                name: 'date',
                ref: true,
                normalize: (e) => (e === 'now' ? e : a.parse(e)),
                assert: (e) => e !== null,
                message: 'must have a valid date format',
              },
            ],
          },
          format: {
            method(e) {
              n(
                ['iso', 'javascript', 'unix'].includes(e),
                'Unknown date format',
                e
              )
              return this.$_setFlag('format', e)
            },
          },
          greater: {
            method(e) {
              return this.$_addRule({
                name: 'greater',
                method: 'compare',
                args: { date: e },
                operator: '>',
              })
            },
          },
          iso: {
            method() {
              return this.format('iso')
            },
          },
          less: {
            method(e) {
              return this.$_addRule({
                name: 'less',
                method: 'compare',
                args: { date: e },
                operator: '<',
              })
            },
          },
          max: {
            method(e) {
              return this.$_addRule({
                name: 'max',
                method: 'compare',
                args: { date: e },
                operator: '<=',
              })
            },
          },
          min: {
            method(e) {
              return this.$_addRule({
                name: 'min',
                method: 'compare',
                args: { date: e },
                operator: '>=',
              })
            },
          },
          timestamp: {
            method(e = 'javascript') {
              n(
                ['javascript', 'unix'].includes(e),
                '"type" must be one of "javascript, unix"'
              )
              return this.format(e)
            },
          },
        },
        cast: {
          number: {
            from: a.isDate,
            to(e, t) {
              return e.getTime()
            },
          },
          string: {
            from: a.isDate,
            to(e, { prefs: t }) {
              return o.date(e, t)
            },
          },
        },
        messages: {
          'date.base': '{{#label}} must be a valid date',
          'date.format':
            '{{#label}} must be in {msg("date.format." + #format) || #format} format',
          'date.greater': '{{#label}} must be greater than "{{#limit}}"',
          'date.less': '{{#label}} must be less than "{{#limit}}"',
          'date.max': '{{#label}} must be less than or equal to "{{#limit}}"',
          'date.min': '{{#label}} must be larger than or equal to "{{#limit}}"',
          'date.format.iso': 'ISO 8601 date',
          'date.format.javascript': 'timestamp or number of milliseconds',
          'date.format.unix': 'timestamp or number of seconds',
        },
      })
      a.parse = function (e, t) {
        if (e instanceof Date) {
          return e
        }
        if (typeof e !== 'string' && (isNaN(e) || !isFinite(e))) {
          return null
        }
        if (/^\s*$/.test(e)) {
          return null
        }
        if (t === 'iso') {
          if (!i.isIsoDate(e)) {
            return null
          }
          return a.date(e.toString())
        }
        const r = e
        if (typeof e === 'string' && /^[+-]?\d+(\.\d+)?$/.test(e)) {
          e = parseFloat(e)
        }
        if (t) {
          if (t === 'javascript') {
            return a.date(1 * e)
          }
          if (t === 'unix') {
            return a.date(1e3 * e)
          }
          if (typeof r === 'string') {
            return null
          }
        }
        return a.date(e)
      }
      a.date = function (e) {
        const t = new Date(e)
        if (!isNaN(t.getTime())) {
          return t
        }
        return null
      }
    },
    3350: function (e, t, r) {
      const n = r(8309)
      const s = r(3546)
      const i = {}
      e.exports = s.extend({
        type: 'function',
        properties: { typeof: 'function' },
        rules: {
          arity: {
            method(e) {
              n(
                Number.isSafeInteger(e) && e >= 0,
                'n must be a positive integer'
              )
              return this.$_addRule({ name: 'arity', args: { n: e } })
            },
            validate(e, t, { n: r }) {
              if (e.length === r) {
                return e
              }
              return t.error('function.arity', { n: r })
            },
          },
          class: {
            method() {
              return this.$_addRule('class')
            },
            validate(e, t) {
              if (/^\s*class\s/.test(e.toString())) {
                return e
              }
              return t.error('function.class', { value: e })
            },
          },
          minArity: {
            method(e) {
              n(
                Number.isSafeInteger(e) && e > 0,
                'n must be a strict positive integer'
              )
              return this.$_addRule({ name: 'minArity', args: { n: e } })
            },
            validate(e, t, { n: r }) {
              if (e.length >= r) {
                return e
              }
              return t.error('function.minArity', { n: r })
            },
          },
          maxArity: {
            method(e) {
              n(
                Number.isSafeInteger(e) && e >= 0,
                'n must be a positive integer'
              )
              return this.$_addRule({ name: 'maxArity', args: { n: e } })
            },
            validate(e, t, { n: r }) {
              if (e.length <= r) {
                return e
              }
              return t.error('function.maxArity', { n: r })
            },
          },
        },
        messages: {
          'function.arity': '{{#label}} must have an arity of {{#n}}',
          'function.class': '{{#label}} must be a class',
          'function.maxArity':
            '{{#label}} must have an arity lesser or equal to {{#n}}',
          'function.minArity':
            '{{#label}} must have an arity greater or equal to {{#n}}',
        },
      })
    },
    3546: function (e, t, r) {
      const n = r(9937)
      const s = r(8309)
      const i = r(546)
      const o = r(4e3)
      const a = r(7379)
      const l = r(7614)
      const c = r(1039)
      const u = r(3377)
      const f = r(5039)
      const d = r(4823)
      const m = {
        renameDefaults: { alias: false, multiple: false, override: false },
      }
      e.exports = a.extend({
        type: '_keys',
        properties: { typeof: 'object' },
        flags: { unknown: { default: false } },
        terms: {
          dependencies: { init: null },
          keys: {
            init: null,
            manifest: { mapped: { from: 'schema', to: 'key' } },
          },
          patterns: { init: null },
          renames: { init: null },
        },
        args(e, t) {
          return e.keys(t)
        },
        validate(e, { schema: t, error: r, state: n, prefs: s }) {
          if (!e || typeof e !== t.$_property('typeof') || Array.isArray(e)) {
            return {
              value: e,
              errors: r('object.base', { type: t.$_property('typeof') }),
            }
          }
          if (
            !t.$_terms.renames &&
            !t.$_terms.dependencies &&
            !t.$_terms.keys &&
            !t.$_terms.patterns &&
            !t.$_terms.externals
          ) {
            return
          }
          e = m.clone(e, s)
          const i = []
          if (t.$_terms.renames && !m.rename(t, e, n, s, i)) {
            return { value: e, errors: i }
          }
          if (
            !t.$_terms.keys &&
            !t.$_terms.patterns &&
            !t.$_terms.dependencies
          ) {
            return { value: e, errors: i }
          }
          const o = new Set(Object.keys(e))
          if (t.$_terms.keys) {
            const r = [e, ...n.ancestors]
            for (const a of t.$_terms.keys) {
              const t = a.key
              const l = e[t]
              o.delete(t)
              const c = n.localize([...n.path, t], r, a)
              const u = a.schema.$_validate(l, c, s)
              if (u.errors) {
                if (s.abortEarly) {
                  return { value: e, errors: u.errors }
                }
                i.push(...u.errors)
              } else if (
                a.schema._flags.result === 'strip' ||
                (u.value === undefined && l !== undefined)
              ) {
                delete e[t]
              } else if (u.value !== undefined) {
                e[t] = u.value
              }
            }
          }
          if (o.size || t._flags._hasPatternMatch) {
            const r = m.unknown(t, e, o, i, n, s)
            if (r) {
              return r
            }
          }
          if (t.$_terms.dependencies) {
            for (const r of t.$_terms.dependencies) {
              if (
                r.key &&
                r.key.resolve(e, n, s, null, { shadow: false }) === undefined
              ) {
                continue
              }
              const o = m.dependencies[r.rel](t, r, e, n, s)
              if (o) {
                const r = t.$_createError(o.code, e, o.context, n, s)
                if (s.abortEarly) {
                  return { value: e, errors: r }
                }
                i.push(r)
              }
            }
          }
          return { value: e, errors: i }
        },
        rules: {
          and: {
            method(...e) {
              l.verifyFlat(e, 'and')
              return m.dependency(this, 'and', null, e)
            },
          },
          append: {
            method(e) {
              if (
                e === null ||
                e === undefined ||
                Object.keys(e).length === 0
              ) {
                return this
              }
              return this.keys(e)
            },
          },
          assert: {
            method(e, t, r) {
              if (!d.isTemplate(e)) {
                e = c.ref(e)
              }
              s(
                r === undefined || typeof r === 'string',
                'Message must be a string'
              )
              t = this.$_compile(t, { appendPath: true })
              const n = this.$_addRule({
                name: 'assert',
                args: { subject: e, schema: t, message: r },
              })
              n.$_mutateRegister(e)
              n.$_mutateRegister(t)
              return n
            },
            validate(
              e,
              { error: t, prefs: r, state: n },
              { subject: s, schema: i, message: o }
            ) {
              const a = s.resolve(e, n, r)
              const l = f.isRef(s) ? s.absolute(n) : []
              if (i.$_match(a, n.localize(l, [e, ...n.ancestors], i), r)) {
                return e
              }
              return t('object.assert', { subject: s, message: o })
            },
            args: ['subject', 'schema', 'message'],
            multi: true,
          },
          instance: {
            method(e, t) {
              s(typeof e === 'function', 'constructor must be a function')
              t = t || e.name
              return this.$_addRule({
                name: 'instance',
                args: { constructor: e, name: t },
              })
            },
            validate(e, t, { constructor: r, name: n }) {
              if (e instanceof r) {
                return e
              }
              return t.error('object.instance', { type: n, value: e })
            },
            args: ['constructor', 'name'],
          },
          keys: {
            method(e) {
              s(
                e === undefined || typeof e === 'object',
                'Object schema must be a valid object'
              )
              s(!l.isSchema(e), 'Object schema cannot be a joi schema')
              const t = this.clone()
              if (!e) {
                t.$_terms.keys = null
              } else if (!Object.keys(e).length) {
                t.$_terms.keys = new m.Keys()
              } else {
                t.$_terms.keys = t.$_terms.keys
                  ? t.$_terms.keys.filter((t) => !e.hasOwnProperty(t.key))
                  : new m.Keys()
                for (const r in e) {
                  l.tryWithPath(
                    () =>
                      t.$_terms.keys.push({
                        key: r,
                        schema: this.$_compile(e[r]),
                      }),
                    r
                  )
                }
              }
              return t.$_mutateRebuild()
            },
          },
          length: {
            method(e) {
              return this.$_addRule({
                name: 'length',
                args: { limit: e },
                operator: '=',
              })
            },
            validate(e, t, { limit: r }, { name: n, operator: s, args: i }) {
              if (l.compare(Object.keys(e).length, r, s)) {
                return e
              }
              return t.error('object.' + n, { limit: i.limit, value: e })
            },
            args: [
              {
                name: 'limit',
                ref: true,
                assert: l.limit,
                message: 'must be a positive integer',
              },
            ],
          },
          max: {
            method(e) {
              return this.$_addRule({
                name: 'max',
                method: 'length',
                args: { limit: e },
                operator: '<=',
              })
            },
          },
          min: {
            method(e) {
              return this.$_addRule({
                name: 'min',
                method: 'length',
                args: { limit: e },
                operator: '>=',
              })
            },
          },
          nand: {
            method(...e) {
              l.verifyFlat(e, 'nand')
              return m.dependency(this, 'nand', null, e)
            },
          },
          or: {
            method(...e) {
              l.verifyFlat(e, 'or')
              return m.dependency(this, 'or', null, e)
            },
          },
          oxor: {
            method(...e) {
              return m.dependency(this, 'oxor', null, e)
            },
          },
          pattern: {
            method(e, t, r = {}) {
              const n = e instanceof RegExp
              if (!n) {
                e = this.$_compile(e, { appendPath: true })
              }
              s(t !== undefined, 'Invalid rule')
              l.assertOptions(r, ['fallthrough', 'matches'])
              if (n) {
                s(
                  !e.flags.includes('g') && !e.flags.includes('y'),
                  'pattern should not use global or sticky mode'
                )
              }
              t = this.$_compile(t, { appendPath: true })
              const i = this.clone()
              i.$_terms.patterns = i.$_terms.patterns || []
              const o = { [n ? 'regex' : 'schema']: e, rule: t }
              if (r.matches) {
                o.matches = this.$_compile(r.matches)
                if (o.matches.type !== 'array') {
                  o.matches = o.matches.$_root.array().items(o.matches)
                }
                i.$_mutateRegister(o.matches)
                i.$_setFlag('_hasPatternMatch', true, { clone: false })
              }
              if (r.fallthrough) {
                o.fallthrough = true
              }
              i.$_terms.patterns.push(o)
              i.$_mutateRegister(t)
              return i
            },
          },
          ref: {
            method() {
              return this.$_addRule('ref')
            },
            validate(e, t) {
              if (f.isRef(e)) {
                return e
              }
              return t.error('object.refType', { value: e })
            },
          },
          regex: {
            method() {
              return this.$_addRule('regex')
            },
            validate(e, t) {
              if (e instanceof RegExp) {
                return e
              }
              return t.error('object.regex', { value: e })
            },
          },
          rename: {
            method(e, t, r = {}) {
              s(
                typeof e === 'string' || e instanceof RegExp,
                'Rename missing the from argument'
              )
              s(
                typeof t === 'string' || t instanceof d,
                'Invalid rename to argument'
              )
              s(t !== e, 'Cannot rename key to same name:', e)
              l.assertOptions(r, [
                'alias',
                'ignoreUndefined',
                'override',
                'multiple',
              ])
              const i = this.clone()
              i.$_terms.renames = i.$_terms.renames || []
              for (const t of i.$_terms.renames) {
                s(t.from !== e, 'Cannot rename the same key multiple times')
              }
              if (t instanceof d) {
                i.$_mutateRegister(t)
              }
              i.$_terms.renames.push({
                from: e,
                to: t,
                options: n(m.renameDefaults, r),
              })
              return i
            },
          },
          schema: {
            method(e = 'any') {
              return this.$_addRule({ name: 'schema', args: { type: e } })
            },
            validate(e, t, { type: r }) {
              if (l.isSchema(e) && (r === 'any' || e.type === r)) {
                return e
              }
              return t.error('object.schema', { type: r })
            },
          },
          unknown: {
            method(e) {
              return this.$_setFlag('unknown', e !== false)
            },
          },
          with: {
            method(e, t, r = {}) {
              return m.dependency(this, 'with', e, t, r)
            },
          },
          without: {
            method(e, t, r = {}) {
              return m.dependency(this, 'without', e, t, r)
            },
          },
          xor: {
            method(...e) {
              l.verifyFlat(e, 'xor')
              return m.dependency(this, 'xor', null, e)
            },
          },
        },
        overrides: {
          default(e, t) {
            if (e === undefined) {
              e = l.symbols.deepDefault
            }
            return this.$_super.default(e, t)
          },
        },
        rebuild(e) {
          if (e.$_terms.keys) {
            const t = new o.Sorter()
            for (const r of e.$_terms.keys) {
              l.tryWithPath(
                () =>
                  t.add(r, {
                    after: r.schema.$_rootReferences(),
                    group: r.key,
                  }),
                r.key
              )
            }
            e.$_terms.keys = new m.Keys(...t.nodes)
          }
        },
        manifest: {
          build(e, t) {
            if (t.keys) {
              e = e.keys(t.keys)
            }
            if (t.dependencies) {
              for (const {
                rel: r,
                key: n = null,
                peers: s,
                options: i,
              } of t.dependencies) {
                e = m.dependency(e, r, n, s, i)
              }
            }
            if (t.patterns) {
              for (const {
                regex: r,
                schema: n,
                rule: s,
                fallthrough: i,
                matches: o,
              } of t.patterns) {
                e = e.pattern(r || n, s, { fallthrough: i, matches: o })
              }
            }
            if (t.renames) {
              for (const { from: r, to: n, options: s } of t.renames) {
                e = e.rename(r, n, s)
              }
            }
            return e
          },
        },
        messages: {
          'object.and':
            '{{#label}} contains {{#presentWithLabels}} without its required peers {{#missingWithLabels}}',
          'object.assert':
            '{{#label}} is invalid because {if(#subject.key, `"` + #subject.key + `" failed to ` + (#message || "pass the assertion test"), #message || "the assertion failed")}',
          'object.base': '{{#label}} must be of type {{#type}}',
          'object.instance': '{{#label}} must be an instance of "{{#type}}"',
          'object.length':
            '{{#label}} must have {{#limit}} key{if(#limit == 1, "", "s")}',
          'object.max':
            '{{#label}} must have less than or equal to {{#limit}} key{if(#limit == 1, "", "s")}',
          'object.min':
            '{{#label}} must have at least {{#limit}} key{if(#limit == 1, "", "s")}',
          'object.missing':
            '{{#label}} must contain at least one of {{#peersWithLabels}}',
          'object.nand':
            '"{{#mainWithLabel}}" must not exist simultaneously with {{#peersWithLabels}}',
          'object.oxor':
            '{{#label}} contains a conflict between optional exclusive peers {{#peersWithLabels}}',
          'object.pattern.match':
            '{{#label}} keys failed to match pattern requirements',
          'object.refType': '{{#label}} must be a Joi reference',
          'object.regex': '{{#label}} must be a RegExp object',
          'object.rename.multiple':
            '{{#label}} cannot rename "{{#from}}" because multiple renames are disabled and another key was already renamed to "{{#to}}"',
          'object.rename.override':
            '{{#label}} cannot rename "{{#from}}" because override is disabled and target "{{#to}}" exists',
          'object.schema': '{{#label}} must be a Joi schema of {{#type}} type',
          'object.unknown': '{{#label}} is not allowed',
          'object.with':
            '"{{#mainWithLabel}}" missing required peer "{{#peerWithLabel}}"',
          'object.without':
            '"{{#mainWithLabel}}" conflict with forbidden peer "{{#peerWithLabel}}"',
          'object.xor':
            '{{#label}} contains a conflict between exclusive peers {{#peersWithLabels}}',
        },
      })
      m.clone = function (e, t) {
        if (typeof e === 'object') {
          if (t.nonEnumerables) {
            return i(e, { shallow: true })
          }
          const r = Object.create(Object.getPrototypeOf(e))
          Object.assign(r, e)
          return r
        }
        const clone = function (...t) {
          return e.apply(this, t)
        }
        clone.prototype = i(e.prototype)
        Object.defineProperty(clone, 'name', { value: e.name, writable: false })
        Object.defineProperty(clone, 'length', {
          value: e.length,
          writable: false,
        })
        Object.assign(clone, e)
        return clone
      }
      m.dependency = function (e, t, r, n, i) {
        s(r === null || typeof r === 'string', t, 'key must be a strings')
        if (!i) {
          i = n.length > 1 && typeof n[n.length - 1] === 'object' ? n.pop() : {}
        }
        l.assertOptions(i, ['separator'])
        n = [].concat(n)
        const o = l.default(i.separator, '.')
        const a = []
        for (const e of n) {
          s(typeof e === 'string', t, 'peers must be a string or a reference')
          a.push(c.ref(e, { separator: o, ancestor: 0, prefix: false }))
        }
        if (r !== null) {
          r = c.ref(r, { separator: o, ancestor: 0, prefix: false })
        }
        const u = e.clone()
        u.$_terms.dependencies = u.$_terms.dependencies || []
        u.$_terms.dependencies.push(new m.Dependency(t, r, a, n))
        return u
      }
      m.dependencies = {
        and(e, t, r, n, s) {
          const i = []
          const o = []
          const a = t.peers.length
          for (const e of t.peers) {
            if (e.resolve(r, n, s, null, { shadow: false }) === undefined) {
              i.push(e.key)
            } else {
              o.push(e.key)
            }
          }
          if (i.length !== a && o.length !== a) {
            return {
              code: 'object.and',
              context: {
                present: o,
                presentWithLabels: m.keysToLabels(e, o),
                missing: i,
                missingWithLabels: m.keysToLabels(e, i),
              },
            }
          }
        },
        nand(e, t, r, n, s) {
          const i = []
          for (const e of t.peers) {
            if (e.resolve(r, n, s, null, { shadow: false }) !== undefined) {
              i.push(e.key)
            }
          }
          if (i.length !== t.peers.length) {
            return
          }
          const o = t.paths[0]
          const a = t.paths.slice(1)
          return {
            code: 'object.nand',
            context: {
              main: o,
              mainWithLabel: m.keysToLabels(e, o),
              peers: a,
              peersWithLabels: m.keysToLabels(e, a),
            },
          }
        },
        or(e, t, r, n, s) {
          for (const e of t.peers) {
            if (e.resolve(r, n, s, null, { shadow: false }) !== undefined) {
              return
            }
          }
          return {
            code: 'object.missing',
            context: {
              peers: t.paths,
              peersWithLabels: m.keysToLabels(e, t.paths),
            },
          }
        },
        oxor(e, t, r, n, s) {
          const i = []
          for (const e of t.peers) {
            if (e.resolve(r, n, s, null, { shadow: false }) !== undefined) {
              i.push(e.key)
            }
          }
          if (!i.length || i.length === 1) {
            return
          }
          const o = {
            peers: t.paths,
            peersWithLabels: m.keysToLabels(e, t.paths),
          }
          o.present = i
          o.presentWithLabels = m.keysToLabels(e, i)
          return { code: 'object.oxor', context: o }
        },
        with(e, t, r, n, s) {
          for (const i of t.peers) {
            if (i.resolve(r, n, s, null, { shadow: false }) === undefined) {
              return {
                code: 'object.with',
                context: {
                  main: t.key.key,
                  mainWithLabel: m.keysToLabels(e, t.key.key),
                  peer: i.key,
                  peerWithLabel: m.keysToLabels(e, i.key),
                },
              }
            }
          }
        },
        without(e, t, r, n, s) {
          for (const i of t.peers) {
            if (i.resolve(r, n, s, null, { shadow: false }) !== undefined) {
              return {
                code: 'object.without',
                context: {
                  main: t.key.key,
                  mainWithLabel: m.keysToLabels(e, t.key.key),
                  peer: i.key,
                  peerWithLabel: m.keysToLabels(e, i.key),
                },
              }
            }
          }
        },
        xor(e, t, r, n, s) {
          const i = []
          for (const e of t.peers) {
            if (e.resolve(r, n, s, null, { shadow: false }) !== undefined) {
              i.push(e.key)
            }
          }
          if (i.length === 1) {
            return
          }
          const o = {
            peers: t.paths,
            peersWithLabels: m.keysToLabels(e, t.paths),
          }
          if (i.length === 0) {
            return { code: 'object.missing', context: o }
          }
          o.present = i
          o.presentWithLabels = m.keysToLabels(e, i)
          return { code: 'object.xor', context: o }
        },
      }
      m.keysToLabels = function (e, t) {
        if (Array.isArray(t)) {
          return t.map((t) => e.$_mapLabels(t))
        }
        return e.$_mapLabels(t)
      }
      m.rename = function (e, t, r, n, s) {
        const i = {}
        for (const o of e.$_terms.renames) {
          const a = []
          const l = typeof o.from !== 'string'
          if (!l) {
            if (
              Object.prototype.hasOwnProperty.call(t, o.from) &&
              (t[o.from] !== undefined || !o.options.ignoreUndefined)
            ) {
              a.push(o)
            }
          } else {
            for (const e in t) {
              if (t[e] === undefined && o.options.ignoreUndefined) {
                continue
              }
              if (e === o.to) {
                continue
              }
              const r = o.from.exec(e)
              if (!r) {
                continue
              }
              a.push({ from: e, to: o.to, match: r })
            }
          }
          for (const c of a) {
            const a = c.from
            let u = c.to
            if (u instanceof d) {
              u = u.render(t, r, n, c.match)
            }
            if (a === u) {
              continue
            }
            if (!o.options.multiple && i[u]) {
              s.push(
                e.$_createError(
                  'object.rename.multiple',
                  t,
                  { from: a, to: u, pattern: l },
                  r,
                  n
                )
              )
              if (n.abortEarly) {
                return false
              }
            }
            if (
              Object.prototype.hasOwnProperty.call(t, u) &&
              !o.options.override &&
              !i[u]
            ) {
              s.push(
                e.$_createError(
                  'object.rename.override',
                  t,
                  { from: a, to: u, pattern: l },
                  r,
                  n
                )
              )
              if (n.abortEarly) {
                return false
              }
            }
            if (t[a] === undefined) {
              delete t[u]
            } else {
              t[u] = t[a]
            }
            i[u] = true
            if (!o.options.alias) {
              delete t[a]
            }
          }
        }
        return true
      }
      m.unknown = function (e, t, r, n, s, i) {
        if (e.$_terms.patterns) {
          let o = false
          const a = e.$_terms.patterns.map((e) => {
            if (e.matches) {
              o = true
              return []
            }
          })
          const l = [t, ...s.ancestors]
          for (const o of r) {
            const c = t[o]
            const u = [...s.path, o]
            for (let f = 0; f < e.$_terms.patterns.length; ++f) {
              const d = e.$_terms.patterns[f]
              if (d.regex) {
                const e = d.regex.test(o)
                s.mainstay.tracer.debug(
                  s,
                  'rule',
                  `pattern.${f}`,
                  e ? 'pass' : 'error'
                )
                if (!e) {
                  continue
                }
              } else {
                if (!d.schema.$_match(o, s.nest(d.schema, `pattern.${f}`), i)) {
                  continue
                }
              }
              r.delete(o)
              const m = s.localize(u, l, { schema: d.rule, key: o })
              const h = d.rule.$_validate(c, m, i)
              if (h.errors) {
                if (i.abortEarly) {
                  return { value: t, errors: h.errors }
                }
                n.push(...h.errors)
              }
              if (d.matches) {
                a[f].push(o)
              }
              t[o] = h.value
              if (!d.fallthrough) {
                break
              }
            }
          }
          if (o) {
            for (let r = 0; r < a.length; ++r) {
              const o = a[r]
              if (!o) {
                continue
              }
              const c = e.$_terms.patterns[r].matches
              const f = s.localize(s.path, l, c)
              const d = c.$_validate(o, f, i)
              if (d.errors) {
                const r = u.details(d.errors, { override: false })
                r.matches = o
                const a = e.$_createError('object.pattern.match', t, r, s, i)
                if (i.abortEarly) {
                  return { value: t, errors: a }
                }
                n.push(a)
              }
            }
          }
        }
        if (!r.size || (!e.$_terms.keys && !e.$_terms.patterns)) {
          return
        }
        if ((i.stripUnknown && !e._flags.unknown) || i.skipFunctions) {
          const e = i.stripUnknown
            ? i.stripUnknown === true
              ? true
              : !!i.stripUnknown.objects
            : false
          for (const n of r) {
            if (e) {
              delete t[n]
              r.delete(n)
            } else if (typeof t[n] === 'function') {
              r.delete(n)
            }
          }
        }
        const o = !l.default(e._flags.unknown, i.allowUnknown)
        if (o) {
          for (const o of r) {
            const r = s.localize([...s.path, o], [])
            const a = e.$_createError(
              'object.unknown',
              t[o],
              { child: o },
              r,
              i,
              { flags: false }
            )
            if (i.abortEarly) {
              return { value: t, errors: a }
            }
            n.push(a)
          }
        }
      }
      m.Dependency = class {
        constructor(e, t, r, n) {
          this.rel = e
          this.key = t
          this.peers = r
          this.paths = n
        }
        describe() {
          const e = { rel: this.rel, peers: this.paths }
          if (this.key !== null) {
            e.key = this.key.key
          }
          if (this.peers[0].separator !== '.') {
            e.options = { separator: this.peers[0].separator }
          }
          return e
        }
      }
      m.Keys = class extends Array {
        concat(e) {
          const t = this.slice()
          const r = new Map()
          for (let e = 0; e < t.length; ++e) {
            r.set(t[e].key, e)
          }
          for (const n of e) {
            const e = n.key
            const s = r.get(e)
            if (s !== undefined) {
              t[s] = { key: e, schema: t[s].schema.concat(n.schema) }
            } else {
              t.push(n)
            }
          }
          return t
        }
      }
    },
    7254: function (e, t, r) {
      const n = r(8309)
      const s = r(7379)
      const i = r(7614)
      const o = r(1039)
      const a = r(3377)
      const l = {}
      e.exports = s.extend({
        type: 'link',
        properties: { schemaChain: true },
        terms: { link: { init: null, manifest: 'single', register: false } },
        args(e, t) {
          return e.ref(t)
        },
        validate(e, { schema: t, state: r, prefs: s }) {
          n(t.$_terms.link, 'Uninitialized link schema')
          const i = l.generate(t, e, r, s)
          const o = t.$_terms.link[0].ref
          return i.$_validate(e, r.nest(i, `link:${o.display}:${i.type}`), s)
        },
        generate(e, t, r, n) {
          return l.generate(e, t, r, n)
        },
        rules: {
          ref: {
            method(e) {
              n(!this.$_terms.link, 'Cannot reinitialize schema')
              e = o.ref(e)
              n(
                e.type === 'value' || e.type === 'local',
                'Invalid reference type:',
                e.type
              )
              n(
                e.type === 'local' || e.ancestor === 'root' || e.ancestor > 0,
                'Link cannot reference itself'
              )
              const t = this.clone()
              t.$_terms.link = [{ ref: e }]
              return t
            },
          },
          relative: {
            method(e = true) {
              return this.$_setFlag('relative', e)
            },
          },
        },
        overrides: {
          concat(e) {
            n(this.$_terms.link, 'Uninitialized link schema')
            n(i.isSchema(e), 'Invalid schema object')
            n(e.type !== 'link', 'Cannot merge type link with another link')
            const t = this.clone()
            if (!t.$_terms.whens) {
              t.$_terms.whens = []
            }
            t.$_terms.whens.push({ concat: e })
            return t.$_mutateRebuild()
          },
        },
        manifest: {
          build(e, t) {
            n(t.link, 'Invalid link description missing link')
            return e.ref(t.link)
          },
        },
      })
      l.generate = function (e, t, r, n) {
        let s = r.mainstay.links.get(e)
        if (s) {
          return s._generate(t, r, n).schema
        }
        const i = e.$_terms.link[0].ref
        const { perspective: o, path: a } = l.perspective(i, r)
        l.assert(o, 'which is outside of schema boundaries', i, e, r, n)
        try {
          s = a.length ? o.$_reach(a) : o
        } catch (t) {
          l.assert(false, 'to non-existing schema', i, e, r, n)
        }
        l.assert(s.type !== 'link', 'which is another link', i, e, r, n)
        if (!e._flags.relative) {
          r.mainstay.links.set(e, s)
        }
        return s._generate(t, r, n).schema
      }
      l.perspective = function (e, t) {
        if (e.type === 'local') {
          for (const { schema: r, key: n } of t.schemas) {
            const t = r._flags.id || n
            if (t === e.path[0]) {
              return { perspective: r, path: e.path.slice(1) }
            }
            if (r.$_terms.shared) {
              for (const t of r.$_terms.shared) {
                if (t._flags.id === e.path[0]) {
                  return { perspective: t, path: e.path.slice(1) }
                }
              }
            }
          }
          return { perspective: null, path: null }
        }
        if (e.ancestor === 'root') {
          return {
            perspective: t.schemas[t.schemas.length - 1].schema,
            path: e.path,
          }
        }
        return {
          perspective: t.schemas[e.ancestor] && t.schemas[e.ancestor].schema,
          path: e.path,
        }
      }
      l.assert = function (e, t, r, s, i, o) {
        if (e) {
          return
        }
        n(
          false,
          `"${a.label(s._flags, i, o)}" contains link reference "${
            r.display
          }" ${t}`
        )
      }
    },
    1163: function (e, t, r) {
      const n = r(8309)
      const s = r(7379)
      const i = r(7614)
      const o = {
        numberRx:
          /^\s*[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e([+-]?\d+))?\s*$/i,
        precisionRx: /(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/,
      }
      e.exports = s.extend({
        type: 'number',
        flags: { unsafe: { default: false } },
        coerce: {
          from: 'string',
          method(e, { schema: t, error: r }) {
            const n = e.match(o.numberRx)
            if (!n) {
              return
            }
            e = e.trim()
            const s = { value: parseFloat(e) }
            if (s.value === 0) {
              s.value = 0
            }
            if (!t._flags.unsafe) {
              if (e.match(/e/i)) {
                const t = o.normalizeExponent(
                  `${s.value / Math.pow(10, n[1])}e${n[1]}`
                )
                if (t !== o.normalizeExponent(e)) {
                  s.errors = r('number.unsafe')
                  return s
                }
              } else {
                const t = s.value.toString()
                if (t.match(/e/i)) {
                  return s
                }
                if (t !== o.normalizeDecimal(e)) {
                  s.errors = r('number.unsafe')
                  return s
                }
              }
            }
            return s
          },
        },
        validate(e, { schema: t, error: r, prefs: n }) {
          if (e === Infinity || e === -Infinity) {
            return { value: e, errors: r('number.infinity') }
          }
          if (!i.isNumber(e)) {
            return { value: e, errors: r('number.base') }
          }
          const s = { value: e }
          if (n.convert) {
            const e = t.$_getRule('precision')
            if (e) {
              const t = Math.pow(10, e.args.limit)
              s.value = Math.round(s.value * t) / t
            }
          }
          if (s.value === 0) {
            s.value = 0
          }
          if (
            !t._flags.unsafe &&
            (e > Number.MAX_SAFE_INTEGER || e < Number.MIN_SAFE_INTEGER)
          ) {
            s.errors = r('number.unsafe')
          }
          return s
        },
        rules: {
          compare: {
            method: false,
            validate(e, t, { limit: r }, { name: n, operator: s, args: o }) {
              if (i.compare(e, r, s)) {
                return e
              }
              return t.error('number.' + n, { limit: o.limit, value: e })
            },
            args: [
              {
                name: 'limit',
                ref: true,
                assert: i.isNumber,
                message: 'must be a number',
              },
            ],
          },
          greater: {
            method(e) {
              return this.$_addRule({
                name: 'greater',
                method: 'compare',
                args: { limit: e },
                operator: '>',
              })
            },
          },
          integer: {
            method() {
              return this.$_addRule('integer')
            },
            validate(e, t) {
              if (Math.trunc(e) - e === 0) {
                return e
              }
              return t.error('number.integer')
            },
          },
          less: {
            method(e) {
              return this.$_addRule({
                name: 'less',
                method: 'compare',
                args: { limit: e },
                operator: '<',
              })
            },
          },
          max: {
            method(e) {
              return this.$_addRule({
                name: 'max',
                method: 'compare',
                args: { limit: e },
                operator: '<=',
              })
            },
          },
          min: {
            method(e) {
              return this.$_addRule({
                name: 'min',
                method: 'compare',
                args: { limit: e },
                operator: '>=',
              })
            },
          },
          multiple: {
            method(e) {
              return this.$_addRule({ name: 'multiple', args: { base: e } })
            },
            validate(e, t, { base: r }, n) {
              if (e % r === 0) {
                return e
              }
              return t.error('number.multiple', {
                multiple: n.args.base,
                value: e,
              })
            },
            args: [
              {
                name: 'base',
                ref: true,
                assert: (e) => typeof e === 'number' && isFinite(e) && e > 0,
                message: 'must be a positive number',
              },
            ],
            multi: true,
          },
          negative: {
            method() {
              return this.sign('negative')
            },
          },
          port: {
            method() {
              return this.$_addRule('port')
            },
            validate(e, t) {
              if (Number.isSafeInteger(e) && e >= 0 && e <= 65535) {
                return e
              }
              return t.error('number.port')
            },
          },
          positive: {
            method() {
              return this.sign('positive')
            },
          },
          precision: {
            method(e) {
              n(Number.isSafeInteger(e), 'limit must be an integer')
              return this.$_addRule({ name: 'precision', args: { limit: e } })
            },
            validate(e, t, { limit: r }) {
              const n = e.toString().match(o.precisionRx)
              const s = Math.max(
                (n[1] ? n[1].length : 0) - (n[2] ? parseInt(n[2], 10) : 0),
                0
              )
              if (s <= r) {
                return e
              }
              return t.error('number.precision', { limit: r, value: e })
            },
            convert: true,
          },
          sign: {
            method(e) {
              n(['negative', 'positive'].includes(e), 'Invalid sign', e)
              return this.$_addRule({ name: 'sign', args: { sign: e } })
            },
            validate(e, t, { sign: r }) {
              if ((r === 'negative' && e < 0) || (r === 'positive' && e > 0)) {
                return e
              }
              return t.error(`number.${r}`)
            },
          },
          unsafe: {
            method(e = true) {
              n(typeof e === 'boolean', 'enabled must be a boolean')
              return this.$_setFlag('unsafe', e)
            },
          },
        },
        cast: {
          string: {
            from: (e) => typeof e === 'number',
            to(e, t) {
              return e.toString()
            },
          },
        },
        messages: {
          'number.base': '{{#label}} must be a number',
          'number.greater': '{{#label}} must be greater than {{#limit}}',
          'number.infinity': '{{#label}} cannot be infinity',
          'number.integer': '{{#label}} must be an integer',
          'number.less': '{{#label}} must be less than {{#limit}}',
          'number.max': '{{#label}} must be less than or equal to {{#limit}}',
          'number.min': '{{#label}} must be larger than or equal to {{#limit}}',
          'number.multiple': '{{#label}} must be a multiple of {{#multiple}}',
          'number.negative': '{{#label}} must be a negative number',
          'number.port': '{{#label}} must be a valid port',
          'number.positive': '{{#label}} must be a positive number',
          'number.precision':
            '{{#label}} must have no more than {{#limit}} decimal places',
          'number.unsafe': '{{#label}} must be a safe number',
        },
      })
      o.normalizeExponent = function (e) {
        return e
          .replace(/E/, 'e')
          .replace(/\.(\d*[1-9])?0+e/, '.$1e')
          .replace(/\.e/, 'e')
          .replace(/e\+/, 'e')
          .replace(/^\+/, '')
          .replace(/^(-?)0+([1-9])/, '$1$2')
      }
      o.normalizeDecimal = function (e) {
        e = e
          .replace(/^\+/, '')
          .replace(/\.0+$/, '')
          .replace(/^(-?)\.([^\.]*)$/, '$10.$2')
          .replace(/^(-?)0+([1-9])/, '$1$2')
        if (e.includes('.') && e.endsWith('0')) {
          e = e.replace(/0+$/, '')
        }
        if (e === '-0') {
          return '0'
        }
        return e
      }
    },
    7381: function (e, t, r) {
      const n = r(3546)
      const s = {}
      e.exports = n.extend({
        type: 'object',
        cast: {
          map: {
            from: (e) => e && typeof e === 'object',
            to(e, t) {
              return new Map(Object.entries(e))
            },
          },
        },
      })
    },
    8448: function (e, t, r) {
      const n = r(8309)
      const s = r(579)
      const i = r(1700)
      const o = r(8892)
      const a = r(9141)
      const l = r(6250)
      const c = r(4673)
      const u = r(7379)
      const f = r(7614)
      const d = {
        tlds: l instanceof Set ? { tlds: { allow: l, deny: null } } : false,
        base64Regex: {
          true: {
            true: /^(?:[\w\-]{2}[\w\-]{2})*(?:[\w\-]{2}==|[\w\-]{3}=)?$/,
            false:
              /^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/,
          },
          false: {
            true: /^(?:[\w\-]{2}[\w\-]{2})*(?:[\w\-]{2}(==)?|[\w\-]{3}=?)?$/,
            false:
              /^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}(==)?|[A-Za-z0-9+\/]{3}=?)?$/,
          },
        },
        dataUriRegex:
          /^data:[\w+.-]+\/[\w+.-]+;((charset=[\w-]+|base64),)?(.*)$/,
        hexRegex: /^[a-f0-9]+$/i,
        ipRegex: o.regex().regex,
        isoDurationRegex:
          /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/,
        guidBrackets: { '{': '}', '[': ']', '(': ')', '': '' },
        guidVersions: {
          uuidv1: '1',
          uuidv2: '2',
          uuidv3: '3',
          uuidv4: '4',
          uuidv5: '5',
        },
        cidrPresences: ['required', 'optional', 'forbidden'],
        normalizationForms: ['NFC', 'NFD', 'NFKC', 'NFKD'],
      }
      e.exports = u.extend({
        type: 'string',
        flags: {
          insensitive: { default: false },
          truncate: { default: false },
        },
        terms: { replacements: { init: null } },
        coerce: {
          from: 'string',
          method(e, { schema: t, state: r, prefs: n }) {
            const s = t.$_getRule('normalize')
            if (s) {
              e = e.normalize(s.args.form)
            }
            const i = t.$_getRule('case')
            if (i) {
              e =
                i.args.direction === 'upper'
                  ? e.toLocaleUpperCase()
                  : e.toLocaleLowerCase()
            }
            const o = t.$_getRule('trim')
            if (o && o.args.enabled) {
              e = e.trim()
            }
            if (t.$_terms.replacements) {
              for (const r of t.$_terms.replacements) {
                e = e.replace(r.pattern, r.replacement)
              }
            }
            const a = t.$_getRule('hex')
            if (a && a.args.options.byteAligned && e.length % 2 !== 0) {
              e = `0${e}`
            }
            if (t.$_getRule('isoDate')) {
              const t = d.isoDate(e)
              if (t) {
                e = t
              }
            }
            if (t._flags.truncate) {
              const s = t.$_getRule('max')
              if (s) {
                let i = s.args.limit
                if (f.isResolvable(i)) {
                  i = i.resolve(e, r, n)
                  if (!f.limit(i)) {
                    return {
                      value: e,
                      errors: t.$_createError(
                        'any.ref',
                        i,
                        {
                          ref: s.args.limit,
                          arg: 'limit',
                          reason: 'must be a positive integer',
                        },
                        r,
                        n
                      ),
                    }
                  }
                }
                e = e.slice(0, i)
              }
            }
            return { value: e }
          },
        },
        validate(e, { error: t }) {
          if (typeof e !== 'string') {
            return { value: e, errors: t('string.base') }
          }
          if (e === '') {
            return { value: e, errors: t('string.empty') }
          }
        },
        rules: {
          alphanum: {
            method() {
              return this.$_addRule('alphanum')
            },
            validate(e, t) {
              if (/^[a-zA-Z0-9]+$/.test(e)) {
                return e
              }
              return t.error('string.alphanum')
            },
          },
          base64: {
            method(e = {}) {
              f.assertOptions(e, ['paddingRequired', 'urlSafe'])
              e = { urlSafe: false, paddingRequired: true, ...e }
              n(
                typeof e.paddingRequired === 'boolean',
                'paddingRequired must be boolean'
              )
              n(typeof e.urlSafe === 'boolean', 'urlSafe must be boolean')
              return this.$_addRule({ name: 'base64', args: { options: e } })
            },
            validate(e, t, { options: r }) {
              const n = d.base64Regex[r.paddingRequired][r.urlSafe]
              if (n.test(e)) {
                return e
              }
              return t.error('string.base64')
            },
          },
          case: {
            method(e) {
              n(['lower', 'upper'].includes(e), 'Invalid case:', e)
              return this.$_addRule({ name: 'case', args: { direction: e } })
            },
            validate(e, t, { direction: r }) {
              if (
                (r === 'lower' && e === e.toLocaleLowerCase()) ||
                (r === 'upper' && e === e.toLocaleUpperCase())
              ) {
                return e
              }
              return t.error(`string.${r}case`)
            },
            convert: true,
          },
          creditCard: {
            method() {
              return this.$_addRule('creditCard')
            },
            validate(e, t) {
              let r = e.length
              let n = 0
              let s = 1
              while (r--) {
                const t = e.charAt(r) * s
                n = n + (t - (t > 9) * 9)
                s = s ^ 3
              }
              if (n > 0 && n % 10 === 0) {
                return e
              }
              return t.error('string.creditCard')
            },
          },
          dataUri: {
            method(e = {}) {
              f.assertOptions(e, ['paddingRequired'])
              e = { paddingRequired: true, ...e }
              n(
                typeof e.paddingRequired === 'boolean',
                'paddingRequired must be boolean'
              )
              return this.$_addRule({ name: 'dataUri', args: { options: e } })
            },
            validate(e, t, { options: r }) {
              const n = e.match(d.dataUriRegex)
              if (n) {
                if (!n[2]) {
                  return e
                }
                if (n[2] !== 'base64') {
                  return e
                }
                const t = d.base64Regex[r.paddingRequired].false
                if (t.test(n[3])) {
                  return e
                }
              }
              return t.error('string.dataUri')
            },
          },
          domain: {
            method(e) {
              if (e) {
                f.assertOptions(e, [
                  'allowUnicode',
                  'minDomainSegments',
                  'tlds',
                ])
              }
              const t = d.addressOptions(e)
              return this.$_addRule({
                name: 'domain',
                args: { options: e },
                address: t,
              })
            },
            validate(e, t, r, { address: n }) {
              if (s.isValid(e, n)) {
                return e
              }
              return t.error('string.domain')
            },
          },
          email: {
            method(e = {}) {
              f.assertOptions(e, [
                'allowUnicode',
                'ignoreLength',
                'minDomainSegments',
                'multiple',
                'separator',
                'tlds',
              ])
              n(
                e.multiple === undefined || typeof e.multiple === 'boolean',
                'multiple option must be an boolean'
              )
              const t = d.addressOptions(e)
              const r = new RegExp(
                `\\s*[${e.separator ? a(e.separator) : ','}]\\s*`
              )
              return this.$_addRule({
                name: 'email',
                args: { options: e },
                regex: r,
                address: t,
              })
            },
            validate(e, t, { options: r }, { regex: n, address: s }) {
              const o = r.multiple ? e.split(n) : [e]
              const a = []
              for (const e of o) {
                if (!i.isValid(e, s)) {
                  a.push(e)
                }
              }
              if (!a.length) {
                return e
              }
              return t.error('string.email', { value: e, invalids: a })
            },
          },
          guid: {
            alias: 'uuid',
            method(e = {}) {
              f.assertOptions(e, ['version'])
              let t = ''
              if (e.version) {
                const r = [].concat(e.version)
                n(
                  r.length >= 1,
                  'version must have at least 1 valid version specified'
                )
                const s = new Set()
                for (let e = 0; e < r.length; ++e) {
                  const i = r[e]
                  n(
                    typeof i === 'string',
                    'version at position ' + e + ' must be a string'
                  )
                  const o = d.guidVersions[i.toLowerCase()]
                  n(
                    o,
                    'version at position ' +
                      e +
                      ' must be one of ' +
                      Object.keys(d.guidVersions).join(', ')
                  )
                  n(
                    !s.has(o),
                    'version at position ' + e + ' must not be a duplicate'
                  )
                  t += o
                  s.add(o)
                }
              }
              const r = new RegExp(
                `^([\\[{\\(]?)[0-9A-F]{8}([:-]?)[0-9A-F]{4}\\2?[${
                  t || '0-9A-F'
                }][0-9A-F]{3}\\2?[${
                  t ? '89AB' : '0-9A-F'
                }][0-9A-F]{3}\\2?[0-9A-F]{12}([\\]}\\)]?)$`,
                'i'
              )
              return this.$_addRule({
                name: 'guid',
                args: { options: e },
                regex: r,
              })
            },
            validate(e, t, r, { regex: n }) {
              const s = n.exec(e)
              if (!s) {
                return t.error('string.guid')
              }
              if (d.guidBrackets[s[1]] !== s[s.length - 1]) {
                return t.error('string.guid')
              }
              return e
            },
          },
          hex: {
            method(e = {}) {
              f.assertOptions(e, ['byteAligned'])
              e = { byteAligned: false, ...e }
              n(
                typeof e.byteAligned === 'boolean',
                'byteAligned must be boolean'
              )
              return this.$_addRule({ name: 'hex', args: { options: e } })
            },
            validate(e, t, { options: r }) {
              if (!d.hexRegex.test(e)) {
                return t.error('string.hex')
              }
              if (r.byteAligned && e.length % 2 !== 0) {
                return t.error('string.hexAlign')
              }
              return e
            },
          },
          hostname: {
            method() {
              return this.$_addRule('hostname')
            },
            validate(e, t) {
              if (s.isValid(e, { minDomainSegments: 1 }) || d.ipRegex.test(e)) {
                return e
              }
              return t.error('string.hostname')
            },
          },
          insensitive: {
            method() {
              return this.$_setFlag('insensitive', true)
            },
          },
          ip: {
            method(e = {}) {
              f.assertOptions(e, ['cidr', 'version'])
              const { cidr: t, versions: r, regex: n } = o.regex(e)
              const s = e.version ? r : undefined
              return this.$_addRule({
                name: 'ip',
                args: { options: { cidr: t, version: s } },
                regex: n,
              })
            },
            validate(e, t, { options: r }, { regex: n }) {
              if (n.test(e)) {
                return e
              }
              if (r.version) {
                return t.error('string.ipVersion', {
                  value: e,
                  cidr: r.cidr,
                  version: r.version,
                })
              }
              return t.error('string.ip', { value: e, cidr: r.cidr })
            },
          },
          isoDate: {
            method() {
              return this.$_addRule('isoDate')
            },
            validate(e, { error: t }) {
              if (d.isoDate(e)) {
                return e
              }
              return t('string.isoDate')
            },
          },
          isoDuration: {
            method() {
              return this.$_addRule('isoDuration')
            },
            validate(e, t) {
              if (d.isoDurationRegex.test(e)) {
                return e
              }
              return t.error('string.isoDuration')
            },
          },
          length: {
            method(e, t) {
              return d.length(this, 'length', e, '=', t)
            },
            validate(
              e,
              t,
              { limit: r, encoding: n },
              { name: s, operator: i, args: o }
            ) {
              const a = n ? Buffer && Buffer.byteLength(e, n) : e.length
              if (f.compare(a, r, i)) {
                return e
              }
              return t.error('string.' + s, {
                limit: o.limit,
                value: e,
                encoding: n,
              })
            },
            args: [
              {
                name: 'limit',
                ref: true,
                assert: f.limit,
                message: 'must be a positive integer',
              },
              'encoding',
            ],
          },
          lowercase: {
            method() {
              return this.case('lower')
            },
          },
          max: {
            method(e, t) {
              return d.length(this, 'max', e, '<=', t)
            },
            args: ['limit', 'encoding'],
          },
          min: {
            method(e, t) {
              return d.length(this, 'min', e, '>=', t)
            },
            args: ['limit', 'encoding'],
          },
          normalize: {
            method(e = 'NFC') {
              n(
                d.normalizationForms.includes(e),
                'normalization form must be one of ' +
                  d.normalizationForms.join(', ')
              )
              return this.$_addRule({ name: 'normalize', args: { form: e } })
            },
            validate(e, { error: t }, { form: r }) {
              if (e === e.normalize(r)) {
                return e
              }
              return t('string.normalize', { value: e, form: r })
            },
            convert: true,
          },
          pattern: {
            alias: 'regex',
            method(e, t = {}) {
              n(e instanceof RegExp, 'regex must be a RegExp')
              n(
                !e.flags.includes('g') && !e.flags.includes('y'),
                'regex should not use global or sticky mode'
              )
              if (typeof t === 'string') {
                t = { name: t }
              }
              f.assertOptions(t, ['invert', 'name'])
              const r = [
                'string.pattern',
                t.invert ? '.invert' : '',
                t.name ? '.name' : '.base',
              ].join('')
              return this.$_addRule({
                name: 'pattern',
                args: { regex: e, options: t },
                errorCode: r,
              })
            },
            validate(e, t, { regex: r, options: n }, { errorCode: s }) {
              const i = r.test(e)
              if (i ^ n.invert) {
                return e
              }
              return t.error(s, { name: n.name, regex: r, value: e })
            },
            args: ['regex', 'options'],
            multi: true,
          },
          replace: {
            method(e, t) {
              if (typeof e === 'string') {
                e = new RegExp(a(e), 'g')
              }
              n(e instanceof RegExp, 'pattern must be a RegExp')
              n(typeof t === 'string', 'replacement must be a String')
              const r = this.clone()
              if (!r.$_terms.replacements) {
                r.$_terms.replacements = []
              }
              r.$_terms.replacements.push({ pattern: e, replacement: t })
              return r
            },
          },
          token: {
            method() {
              return this.$_addRule('token')
            },
            validate(e, t) {
              if (/^\w+$/.test(e)) {
                return e
              }
              return t.error('string.token')
            },
          },
          trim: {
            method(e = true) {
              n(typeof e === 'boolean', 'enabled must be a boolean')
              return this.$_addRule({ name: 'trim', args: { enabled: e } })
            },
            validate(e, t, { enabled: r }) {
              if (!r || e === e.trim()) {
                return e
              }
              return t.error('string.trim')
            },
            convert: true,
          },
          truncate: {
            method(e = true) {
              n(typeof e === 'boolean', 'enabled must be a boolean')
              return this.$_setFlag('truncate', e)
            },
          },
          uppercase: {
            method() {
              return this.case('upper')
            },
          },
          uri: {
            method(e = {}) {
              f.assertOptions(e, [
                'allowRelative',
                'allowQuerySquareBrackets',
                'domain',
                'relativeOnly',
                'scheme',
              ])
              if (e.domain) {
                f.assertOptions(e.domain, [
                  'allowUnicode',
                  'minDomainSegments',
                  'tlds',
                ])
              }
              const { regex: t, scheme: r } = c.regex(e)
              const n = e.domain ? d.addressOptions(e.domain) : null
              return this.$_addRule({
                name: 'uri',
                args: { options: e },
                regex: t,
                domain: n,
                scheme: r,
              })
            },
            validate(e, t, { options: r }, { regex: n, domain: i, scheme: o }) {
              if (['http:/', 'https:/'].includes(e)) {
                return t.error('string.uri')
              }
              const a = n.exec(e)
              if (a) {
                if (i) {
                  const e = a[1] || a[2]
                  if (!s.isValid(e, i)) {
                    return t.error('string.domain', { value: e })
                  }
                }
                return e
              }
              if (r.relativeOnly) {
                return t.error('string.uriRelativeOnly')
              }
              if (r.scheme) {
                return t.error('string.uriCustomScheme', {
                  scheme: o,
                  value: e,
                })
              }
              return t.error('string.uri')
            },
          },
        },
        manifest: {
          build(e, t) {
            if (t.replacements) {
              for (const { pattern: r, replacement: n } of t.replacements) {
                e = e.replace(r, n)
              }
            }
            return e
          },
        },
        messages: {
          'string.alphanum':
            '{{#label}} must only contain alpha-numeric characters',
          'string.base': '{{#label}} must be a string',
          'string.base64': '{{#label}} must be a valid base64 string',
          'string.creditCard': '{{#label}} must be a credit card',
          'string.dataUri': '{{#label}} must be a valid dataUri string',
          'string.domain': '{{#label}} must contain a valid domain name',
          'string.email': '{{#label}} must be a valid email',
          'string.empty': '{{#label}} is not allowed to be empty',
          'string.guid': '{{#label}} must be a valid GUID',
          'string.hex': '{{#label}} must only contain hexadecimal characters',
          'string.hexAlign':
            '{{#label}} hex decoded representation must be byte aligned',
          'string.hostname': '{{#label}} must be a valid hostname',
          'string.ip':
            '{{#label}} must be a valid ip address with a {{#cidr}} CIDR',
          'string.ipVersion':
            '{{#label}} must be a valid ip address of one of the following versions {{#version}} with a {{#cidr}} CIDR',
          'string.isoDate': '{{#label}} must be in iso format',
          'string.isoDuration': '{{#label}} must be a valid ISO 8601 duration',
          'string.length':
            '{{#label}} length must be {{#limit}} characters long',
          'string.lowercase':
            '{{#label}} must only contain lowercase characters',
          'string.max':
            '{{#label}} length must be less than or equal to {{#limit}} characters long',
          'string.min':
            '{{#label}} length must be at least {{#limit}} characters long',
          'string.normalize':
            '{{#label}} must be unicode normalized in the {{#form}} form',
          'string.token':
            '{{#label}} must only contain alpha-numeric and underscore characters',
          'string.pattern.base':
            '{{#label}} with value "{[.]}" fails to match the required pattern: {{#regex}}',
          'string.pattern.name':
            '{{#label}} with value "{[.]}" fails to match the {{#name}} pattern',
          'string.pattern.invert.base':
            '{{#label}} with value "{[.]}" matches the inverted pattern: {{#regex}}',
          'string.pattern.invert.name':
            '{{#label}} with value "{[.]}" matches the inverted {{#name}} pattern',
          'string.trim':
            '{{#label}} must not have leading or trailing whitespace',
          'string.uri': '{{#label}} must be a valid uri',
          'string.uriCustomScheme':
            '{{#label}} must be a valid uri with a scheme matching the {{#scheme}} pattern',
          'string.uriRelativeOnly': '{{#label}} must be a valid relative uri',
          'string.uppercase':
            '{{#label}} must only contain uppercase characters',
        },
      })
      d.addressOptions = function (e) {
        if (!e) {
          return e
        }
        n(
          e.minDomainSegments === undefined ||
            (Number.isSafeInteger(e.minDomainSegments) &&
              e.minDomainSegments > 0),
          'minDomainSegments must be a positive integer'
        )
        if (e.tlds === false) {
          return e
        }
        if (e.tlds === true || e.tlds === undefined) {
          n(d.tlds, 'Built-in TLD list disabled')
          return Object.assign({}, e, d.tlds)
        }
        n(typeof e.tlds === 'object', 'tlds must be true, false, or an object')
        const t = e.tlds.deny
        if (t) {
          if (Array.isArray(t)) {
            e = Object.assign({}, e, { tlds: { deny: new Set(t) } })
          }
          n(
            e.tlds.deny instanceof Set,
            'tlds.deny must be an array, Set, or boolean'
          )
          n(!e.tlds.allow, 'Cannot specify both tlds.allow and tlds.deny lists')
          return e
        }
        const r = e.tlds.allow
        if (!r) {
          return e
        }
        if (r === true) {
          n(d.tlds, 'Built-in TLD list disabled')
          return Object.assign({}, e, d.tlds)
        }
        if (Array.isArray(r)) {
          e = Object.assign({}, e, { tlds: { allow: new Set(r) } })
        }
        n(
          e.tlds.allow instanceof Set,
          'tlds.allow must be an array, Set, or boolean'
        )
        return e
      }
      d.isoDate = function (e) {
        if (!f.isIsoDate(e)) {
          return null
        }
        const t = new Date(e)
        if (isNaN(t.getTime())) {
          return null
        }
        return t.toISOString()
      }
      d.length = function (e, t, r, s, i) {
        n(!i || (Buffer && Buffer.isEncoding(i)), 'Invalid encoding:', i)
        return e.$_addRule({
          name: t,
          method: 'length',
          args: { limit: r, encoding: i },
          operator: s,
        })
      }
    },
    1824: function (e, t, r) {
      const n = r(8309)
      const s = r(7379)
      const i = {}
      i.Map = class extends Map {
        slice() {
          return new i.Map(this)
        }
      }
      e.exports = s.extend({
        type: 'symbol',
        terms: { map: { init: new i.Map() } },
        coerce: {
          method(e, { schema: t, error: r }) {
            const n = t.$_terms.map.get(e)
            if (n) {
              e = n
            }
            if (!t._flags.only || typeof e === 'symbol') {
              return { value: e }
            }
            return { value: e, errors: r('symbol.map', { map: t.$_terms.map }) }
          },
        },
        validate(e, { error: t }) {
          if (typeof e !== 'symbol') {
            return { value: e, errors: t('symbol.base') }
          }
        },
        rules: {
          map: {
            method(e) {
              if (e && !e[Symbol.iterator] && typeof e === 'object') {
                e = Object.entries(e)
              }
              n(
                e && e[Symbol.iterator],
                'Iterable must be an iterable or object'
              )
              const t = this.clone()
              const r = []
              for (const s of e) {
                n(s && s[Symbol.iterator], 'Entry must be an iterable')
                const [e, i] = s
                n(
                  typeof e !== 'object' &&
                    typeof e !== 'function' &&
                    typeof e !== 'symbol',
                  'Key must not be of type object, function, or Symbol'
                )
                n(typeof i === 'symbol', 'Value must be a Symbol')
                t.$_terms.map.set(e, i)
                r.push(i)
              }
              return t.valid(...r)
            },
          },
        },
        manifest: {
          build(e, t) {
            if (t.map) {
              e = e.map(t.map)
            }
            return e
          },
        },
        messages: {
          'symbol.base': '{{#label}} must be a symbol',
          'symbol.map': '{{#label}} must be one of {{#map}}',
        },
      })
    },
    2978: function (e, t, r) {
      const n = r(8309)
      const s = r(546)
      const i = r(9309)
      const o = r(6070)
      const a = r(7614)
      const l = r(3377)
      const c = r(9720)
      const u = { result: Symbol('result') }
      t.entry = function (e, t, r) {
        let s = a.defaults
        if (r) {
          n(
            r.warnings === undefined,
            'Cannot override warnings preference in synchronous validation'
          )
          s = a.preferences(a.defaults, r)
        }
        const i = u.entry(e, t, s)
        n(
          !i.mainstay.externals.length,
          'Schema with external rules must use validateAsync()'
        )
        const o = { value: i.value }
        if (i.error) {
          o.error = i.error
        }
        if (i.mainstay.warnings.length) {
          o.warning = l.details(i.mainstay.warnings)
        }
        if (i.mainstay.debug) {
          o.debug = i.mainstay.debug
        }
        return o
      }
      t.entryAsync = async function (e, t, r) {
        let n = a.defaults
        if (r) {
          n = a.preferences(a.defaults, r)
        }
        const s = u.entry(e, t, n)
        const i = s.mainstay
        if (s.error) {
          if (i.debug) {
            s.error.debug = i.debug
          }
          throw s.error
        }
        if (i.externals.length) {
          let e = s.value
          for (const { method: t, path: r, label: n } of i.externals) {
            let s = e
            let i
            let a
            if (r.length) {
              i = r[r.length - 1]
              a = o(e, r.slice(0, -1))
              s = a[i]
            }
            try {
              const r = await t(s)
              if (r === undefined || r === s) {
                continue
              }
              if (a) {
                a[i] = r
              } else {
                e = r
              }
            } catch (e) {
              e.message += ` (${n})`
              throw e
            }
          }
          s.value = e
        }
        if (!n.warnings && !n.debug) {
          return s.value
        }
        const c = { value: s.value }
        if (i.warnings.length) {
          c.warning = l.details(i.warnings)
        }
        if (i.debug) {
          c.debug = i.debug
        }
        return c
      }
      u.entry = function (e, r, n) {
        const { tracer: s, cleanup: i } = u.tracer(r, n)
        const o = n.debug ? [] : null
        const a = r._ids._schemaChain ? new Map() : null
        const f = { externals: [], warnings: [], tracer: s, debug: o, links: a }
        const d = r._ids._schemaChain ? [{ schema: r }] : null
        const m = new c([], [], { mainstay: f, schemas: d })
        const h = t.validate(e, r, m, n)
        if (i) {
          r.$_root.untrace()
        }
        const p = l.process(h.errors, e, n)
        return { value: h.value, error: p, mainstay: f }
      }
      u.tracer = function (e, t) {
        if (e.$_root._tracer) {
          return { tracer: e.$_root._tracer._register(e) }
        }
        if (t.debug) {
          n(e.$_root.trace, 'Debug mode not supported')
          return { tracer: e.$_root.trace()._register(e), cleanup: true }
        }
        return { tracer: u.ignore }
      }
      t.validate = function (e, t, r, n, s = {}) {
        if (t.$_terms.whens) {
          t = t._generate(e, r, n).schema
        }
        if (t._preferences) {
          n = u.prefs(t, n)
        }
        if (t._cache && n.cache) {
          const n = t._cache.get(e)
          r.mainstay.tracer.debug(r, 'validate', 'cached', !!n)
          if (n) {
            return n
          }
        }
        const createError = (s, i, o) => t.$_createError(s, e, i, o || r, n)
        const i = {
          original: e,
          prefs: n,
          schema: t,
          state: r,
          error: createError,
          warn: (e, t, n) => r.mainstay.warnings.push(createError(e, t, n)),
          message: (s, i) =>
            t.$_createError('custom', e, i, r, n, { messages: s }),
        }
        r.mainstay.tracer.entry(t, r)
        const o = t._definition
        if (o.prepare && e !== undefined && n.convert) {
          const t = o.prepare(e, i)
          if (t) {
            r.mainstay.tracer.value(r, 'prepare', e, t.value)
            if (t.errors) {
              return u.finalize(t.value, [].concat(t.errors), i)
            }
            e = t.value
          }
        }
        if (
          o.coerce &&
          e !== undefined &&
          n.convert &&
          (!o.coerce.from || o.coerce.from.includes(typeof e))
        ) {
          const t = o.coerce.method(e, i)
          if (t) {
            r.mainstay.tracer.value(r, 'coerced', e, t.value)
            if (t.errors) {
              return u.finalize(t.value, [].concat(t.errors), i)
            }
            e = t.value
          }
        }
        const l = t._flags.empty
        if (l && l.$_match(u.trim(e, t), r.nest(l), a.defaults)) {
          r.mainstay.tracer.value(r, 'empty', e, undefined)
          e = undefined
        }
        const c =
          s.presence ||
          t._flags.presence ||
          (t._flags._endedSwitch ? 'ignore' : n.presence)
        if (e === undefined) {
          if (c === 'forbidden') {
            return u.finalize(e, null, i)
          }
          if (c === 'required') {
            return u.finalize(
              e,
              [t.$_createError('any.required', e, null, r, n)],
              i
            )
          }
          if (c === 'optional') {
            if (t._flags.default !== a.symbols.deepDefault) {
              return u.finalize(e, null, i)
            }
            r.mainstay.tracer.value(r, 'default', e, {})
            e = {}
          }
        } else if (c === 'forbidden') {
          return u.finalize(
            e,
            [t.$_createError('any.unknown', e, null, r, n)],
            i
          )
        }
        const f = []
        if (t._valids) {
          const s = t._valids.get(e, r, n, t._flags.insensitive)
          if (s) {
            if (n.convert) {
              r.mainstay.tracer.value(r, 'valids', e, s.value)
              e = s.value
            }
            r.mainstay.tracer.filter(t, r, 'valid', s)
            return u.finalize(e, null, i)
          }
          if (t._flags.only) {
            const s = t.$_createError(
              'any.only',
              e,
              { valids: t._valids.values({ display: true }) },
              r,
              n
            )
            if (n.abortEarly) {
              return u.finalize(e, [s], i)
            }
            f.push(s)
          }
        }
        if (t._invalids) {
          const s = t._invalids.get(e, r, n, t._flags.insensitive)
          if (s) {
            r.mainstay.tracer.filter(t, r, 'invalid', s)
            const o = t.$_createError(
              'any.invalid',
              e,
              { invalids: t._invalids.values({ display: true }) },
              r,
              n
            )
            if (n.abortEarly) {
              return u.finalize(e, [o], i)
            }
            f.push(o)
          }
        }
        if (o.validate) {
          const t = o.validate(e, i)
          if (t) {
            r.mainstay.tracer.value(r, 'base', e, t.value)
            e = t.value
            if (t.errors) {
              if (!Array.isArray(t.errors)) {
                f.push(t.errors)
                return u.finalize(e, f, i)
              }
              if (t.errors.length) {
                f.push(...t.errors)
                return u.finalize(e, f, i)
              }
            }
          }
        }
        if (!t._rules.length) {
          return u.finalize(e, f, i)
        }
        return u.rules(e, f, i)
      }
      u.rules = function (e, t, r) {
        const { schema: n, state: s, prefs: i } = r
        for (const o of n._rules) {
          const l = n._definition.rules[o.method]
          if (l.convert && i.convert) {
            s.mainstay.tracer.log(n, s, 'rule', o.name, 'full')
            continue
          }
          let c
          let f = o.args
          if (o._resolve.length) {
            f = Object.assign({}, f)
            for (const t of o._resolve) {
              const r = l.argsByName.get(t)
              const o = f[t].resolve(e, s, i)
              const u = r.normalize ? r.normalize(o) : o
              const d = a.validateArg(u, null, r)
              if (d) {
                c = n.$_createError(
                  'any.ref',
                  o,
                  { arg: t, ref: f[t], reason: d },
                  s,
                  i
                )
                break
              }
              f[t] = u
            }
          }
          c = c || l.validate(e, r, f, o)
          const d = u.rule(c, o)
          if (d.errors) {
            s.mainstay.tracer.log(n, s, 'rule', o.name, 'error')
            if (o.warn) {
              s.mainstay.warnings.push(...d.errors)
              continue
            }
            if (i.abortEarly) {
              return u.finalize(e, d.errors, r)
            }
            t.push(...d.errors)
          } else {
            s.mainstay.tracer.log(n, s, 'rule', o.name, 'pass')
            s.mainstay.tracer.value(s, 'rule', e, d.value, o.name)
            e = d.value
          }
        }
        return u.finalize(e, t, r)
      }
      u.rule = function (e, t) {
        if (e instanceof l.Report) {
          u.error(e, t)
          return { errors: [e], value: null }
        }
        if (
          Array.isArray(e) &&
          (e[0] instanceof l.Report || e[0] instanceof Error)
        ) {
          e.forEach((e) => u.error(e, t))
          return { errors: e, value: null }
        }
        return { errors: null, value: e }
      }
      u.error = function (e, t) {
        if (t.message) {
          e._setTemplate(t.message)
        }
        return e
      }
      u.finalize = function (e, t, r) {
        t = t || []
        const { schema: s, state: i, prefs: o } = r
        if (t.length) {
          const n = u.default('failover', undefined, t, r)
          if (n !== undefined) {
            i.mainstay.tracer.value(i, 'failover', e, n)
            e = n
            t = []
          }
        }
        if (t.length && s._flags.error) {
          if (typeof s._flags.error === 'function') {
            t = s._flags.error(t)
            if (!Array.isArray(t)) {
              t = [t]
            }
            for (const e of t) {
              n(
                e instanceof Error || e instanceof l.Report,
                'error() must return an Error object'
              )
            }
          } else {
            t = [s._flags.error]
          }
        }
        if (e === undefined) {
          const n = u.default('default', e, t, r)
          i.mainstay.tracer.value(i, 'default', e, n)
          e = n
        }
        if (s._flags.cast && e !== undefined) {
          const t = s._definition.cast[s._flags.cast]
          if (t.from(e)) {
            const n = t.to(e, r)
            i.mainstay.tracer.value(i, 'cast', e, n, s._flags.cast)
            e = n
          }
        }
        if (s.$_terms.externals && o.externals && o._externals !== false) {
          for (const { method: e } of s.$_terms.externals) {
            i.mainstay.externals.push({
              method: e,
              path: i.path,
              label: l.label(s._flags, i, o),
            })
          }
        }
        const a = { value: e, errors: t.length ? t : null }
        if (s._flags.result) {
          a.value = s._flags.result === 'strip' ? undefined : r.original
          i.mainstay.tracer.value(i, s._flags.result, e, a.value)
          i.shadow(e, s._flags.result)
        }
        if (s._cache && o.cache !== false && !s._refs.length) {
          s._cache.set(r.original, a)
        }
        return a
      }
      u.prefs = function (e, t) {
        const r = t === a.defaults
        if (r && e._preferences[a.symbols.prefs]) {
          return e._preferences[a.symbols.prefs]
        }
        t = a.preferences(t, e._preferences)
        if (r) {
          e._preferences[a.symbols.prefs] = t
        }
        return t
      }
      u.default = function (e, t, r, n) {
        const { schema: i, state: o, prefs: l } = n
        const c = i._flags[e]
        if (l.noDefaults || c === undefined) {
          return t
        }
        o.mainstay.tracer.log(i, o, 'rule', e, 'full')
        if (!c) {
          return c
        }
        if (typeof c === 'function') {
          const t = c.length ? [s(o.ancestors[0]), n] : []
          try {
            return c(...t)
          } catch (t) {
            r.push(i.$_createError(`any.${e}`, null, { error: t }, o, l))
            return
          }
        }
        if (typeof c !== 'object') {
          return c
        }
        if (c[a.symbols.literal]) {
          return c.literal
        }
        if (a.isResolvable(c)) {
          return c.resolve(t, o, l)
        }
        return s(c)
      }
      u.trim = function (e, t) {
        if (typeof e !== 'string') {
          return e
        }
        const r = t.$_getRule('trim')
        if (!r || !r.args.enabled) {
          return e
        }
        return e.trim()
      }
      u.ignore = {
        active: false,
        debug: i,
        entry: i,
        filter: i,
        log: i,
        resolve: i,
        value: i,
      }
    },
    3054: function (e, t, r) {
      const n = r(8309)
      const s = r(8130)
      const i = r(7614)
      const o = {}
      e.exports = o.Values = class {
        constructor(e, t) {
          this._values = new Set(e)
          this._refs = new Set(t)
          this._lowercase = o.lowercases(e)
          this._override = false
        }
        get length() {
          return this._values.size + this._refs.size
        }
        add(e, t) {
          if (i.isResolvable(e)) {
            if (!this._refs.has(e)) {
              this._refs.add(e)
              if (t) {
                t.register(e)
              }
            }
            return
          }
          if (!this.has(e, null, null, false)) {
            this._values.add(e)
            if (typeof e === 'string') {
              this._lowercase.set(e.toLowerCase(), e)
            }
          }
        }
        static merge(e, t, r) {
          e = e || new o.Values()
          if (t) {
            if (t._override) {
              return t.clone()
            }
            for (const r of [...t._values, ...t._refs]) {
              e.add(r)
            }
          }
          if (r) {
            for (const t of [...r._values, ...r._refs]) {
              e.remove(t)
            }
          }
          return e.length ? e : null
        }
        remove(e) {
          if (i.isResolvable(e)) {
            this._refs.delete(e)
            return
          }
          this._values.delete(e)
          if (typeof e === 'string') {
            this._lowercase.delete(e.toLowerCase())
          }
        }
        has(e, t, r, n) {
          return !!this.get(e, t, r, n)
        }
        get(e, t, r, n) {
          if (!this.length) {
            return false
          }
          if (this._values.has(e)) {
            return { value: e }
          }
          if (typeof e === 'string' && e && n) {
            const t = this._lowercase.get(e.toLowerCase())
            if (t) {
              return { value: t }
            }
          }
          if (!this._refs.size && typeof e !== 'object') {
            return false
          }
          if (typeof e === 'object') {
            for (const t of this._values) {
              if (s(t, e)) {
                return { value: t }
              }
            }
          }
          if (t) {
            for (const i of this._refs) {
              const o = i.resolve(e, t, r, null, { in: true })
              if (o === undefined) {
                continue
              }
              const a =
                !i.in || typeof o !== 'object'
                  ? [o]
                  : Array.isArray(o)
                  ? o
                  : Object.keys(o)
              for (const t of a) {
                if (typeof t !== typeof e) {
                  continue
                }
                if (n && e && typeof e === 'string') {
                  if (t.toLowerCase() === e.toLowerCase()) {
                    return { value: t, ref: i }
                  }
                } else {
                  if (s(t, e)) {
                    return { value: t, ref: i }
                  }
                }
              }
            }
          }
          return false
        }
        override() {
          this._override = true
        }
        values(e) {
          if (e && e.display) {
            const e = []
            for (const t of [...this._values, ...this._refs]) {
              if (t !== undefined) {
                e.push(t)
              }
            }
            return e
          }
          return Array.from([...this._values, ...this._refs])
        }
        clone() {
          const e = new o.Values(this._values, this._refs)
          e._override = this._override
          return e
        }
        concat(e) {
          n(!e._override, 'Cannot concat override set of values')
          const t = new o.Values(
            [...this._values, ...e._values],
            [...this._refs, ...e._refs]
          )
          t._override = this._override
          return t
        }
        describe() {
          const e = []
          if (this._override) {
            e.push({ override: true })
          }
          for (const t of this._values.values()) {
            e.push(t && typeof t === 'object' ? { value: t } : t)
          }
          for (const t of this._refs.values()) {
            e.push(t.describe())
          }
          return e
        }
      }
      o.Values.prototype[i.symbols.values] = true
      o.Values.prototype.slice = o.Values.prototype.clone
      o.lowercases = function (e) {
        const t = new Map()
        if (e) {
          for (const r of e) {
            if (typeof r === 'string') {
              t.set(r.toLowerCase(), r)
            }
          }
        }
        return t
      }
    },
    1287: function (e, t) {
      const r = {}
      t.location = function (e = 0) {
        const t = Error.prepareStackTrace
        Error.prepareStackTrace = (e, t) => t
        const r = {}
        Error.captureStackTrace(r, this)
        const n = r.stack[e + 1]
        Error.prepareStackTrace = t
        return { filename: n.getFileName(), line: n.getLineNumber() }
      }
    },
    4e3: function (e, t, r) {
      const n = r(8309)
      const s = {}
      t.Sorter = class {
        constructor() {
          this._items = []
          this.nodes = []
        }
        add(e, t) {
          t = t || {}
          const r = [].concat(t.before || [])
          const s = [].concat(t.after || [])
          const i = t.group || '?'
          const o = t.sort || 0
          n(!r.includes(i), `Item cannot come before itself: ${i}`)
          n(!r.includes('?'), 'Item cannot come before unassociated items')
          n(!s.includes(i), `Item cannot come after itself: ${i}`)
          n(!s.includes('?'), 'Item cannot come after unassociated items')
          if (!Array.isArray(e)) {
            e = [e]
          }
          for (const t of e) {
            const e = {
              seq: this._items.length,
              sort: o,
              before: r,
              after: s,
              group: i,
              node: t,
            }
            this._items.push(e)
          }
          if (!t.manual) {
            const e = this._sort()
            n(
              e,
              'item',
              i !== '?' ? `added into group ${i}` : '',
              'created a dependencies error'
            )
          }
          return this.nodes
        }
        merge(e) {
          if (!Array.isArray(e)) {
            e = [e]
          }
          for (const t of e) {
            if (t) {
              for (const e of t._items) {
                this._items.push(Object.assign({}, e))
              }
            }
          }
          this._items.sort(s.mergeSort)
          for (let e = 0; e < this._items.length; ++e) {
            this._items[e].seq = e
          }
          const t = this._sort()
          n(t, 'merge created a dependencies error')
          return this.nodes
        }
        sort() {
          const e = this._sort()
          n(e, 'sort created a dependencies error')
          return this.nodes
        }
        _sort() {
          const e = {}
          const t = Object.create(null)
          const r = Object.create(null)
          for (const n of this._items) {
            const s = n.seq
            const i = n.group
            r[i] = r[i] || []
            r[i].push(s)
            e[s] = n.before
            for (const e of n.after) {
              t[e] = t[e] || []
              t[e].push(s)
            }
          }
          for (const t in e) {
            const n = []
            for (const s in e[t]) {
              const i = e[t][s]
              r[i] = r[i] || []
              n.push(...r[i])
            }
            e[t] = n
          }
          for (const n in t) {
            if (r[n]) {
              for (const s of r[n]) {
                e[s].push(...t[n])
              }
            }
          }
          const n = {}
          for (const t in e) {
            const r = e[t]
            for (const e of r) {
              n[e] = n[e] || []
              n[e].push(t)
            }
          }
          const s = {}
          const i = []
          for (let e = 0; e < this._items.length; ++e) {
            let t = e
            if (n[e]) {
              t = null
              for (let e = 0; e < this._items.length; ++e) {
                if (s[e] === true) {
                  continue
                }
                if (!n[e]) {
                  n[e] = []
                }
                const r = n[e].length
                let i = 0
                for (let t = 0; t < r; ++t) {
                  if (s[n[e][t]]) {
                    ++i
                  }
                }
                if (i === r) {
                  t = e
                  break
                }
              }
            }
            if (t !== null) {
              s[t] = true
              i.push(t)
            }
          }
          if (i.length !== this._items.length) {
            return false
          }
          const o = {}
          for (const e of this._items) {
            o[e.seq] = e
          }
          this._items = []
          this.nodes = []
          for (const e of i) {
            const t = o[e]
            this.nodes.push(t.node)
            this._items.push(t)
          }
          return true
        }
      }
      s.mergeSort = (e, t) => (e.sort === t.sort ? 0 : e.sort < t.sort ? -1 : 1)
    },
    7310: function (e) {
      e.exports = require('url')
    },
    3837: function (e) {
      e.exports = require('util')
    },
    5471: function (e) {
      e.exports = JSON.parse(
        '{"name":"@hapi/joi","description":"Object schema validation","version":"17.1.1","repository":"git://github.com/hapijs/joi","main":"src/index.js","browser":"dist/joi-browser.min.js","files":["src/**/*","dist/*"],"keywords":["schema","validation"],"dependencies":{"@hapi/address":"^4.0.1","@hapi/formula":"^2.0.0","@hapi/hoek":"^9.0.0","@hapi/pinpoint":"^2.0.0","@hapi/topo":"^5.0.0"},"devDependencies":{"@hapi/bourne":"2.x.x","@hapi/code":"8.x.x","@hapi/lab":"22.x.x","@hapi/joi-legacy-test":"npm:@hapi/joi@15.x.x"},"scripts":{"prepublishOnly":"cd browser && npm install && npm run build","test":"lab -t 100 -a @hapi/code -L","test-cov-html":"lab -r html -o coverage.html -a @hapi/code"},"license":"BSD-3-Clause"}'
      )
    },
  }
  var t = {}
  function __nccwpck_require__(r) {
    var n = t[r]
    if (n !== undefined) {
      return n.exports
    }
    var s = (t[r] = { exports: {} })
    var i = true
    try {
      e[r](s, s.exports, __nccwpck_require__)
      i = false
    } finally {
      if (i) delete t[r]
    }
    return s.exports
  }
  if (typeof __nccwpck_require__ !== 'undefined')
    __nccwpck_require__.ab = __dirname + '/'
  var r = __nccwpck_require__(7268)
  module.exports = r
})()
