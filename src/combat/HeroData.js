// Hero Roster & Attribute Definitions
export const HEROES_LIST = [
  {
    id: 'spiderman',
    name: 'Spiderman',
    class: 'Fighter',
    hp: 120,
    maxHp: 120,
    atk: 50,
    ultThreshold: 100,
    ultType: 'deal',
    ultName: 'Overdrive',
    ultDesc: '+20 Attack Strength Boost',
    icon: '/assets/ui/profile/spiderman.webp',
    model: '/assets/characters/spiderman/spiderman.glb'
  },
  {
    id: 'ironman',
    name: 'Iron Man',
    class: 'Fighter',
    hp: 120,
    maxHp: 120,
    atk: 50,
    ultThreshold: 100,
    ultType: 'deal',
    ultName: 'Overdrive',
    ultDesc: '+30 ATK Unibeam Burst',
    icon: '/assets/ui/profile/ironman.webp',
    model: '/assets/characters/spiderman/spiderman.glb'
  },
  {
    id: 'thor',
    name: 'Thor',
    class: 'Tank',
    hp: 180,
    maxHp: 180,
    atk: 30,
    ultThreshold: 100,
    ultType: 'take',
    ultName: 'Kinetic Bastion',
    ultDesc: 'Heal +40 HP & Reflect 50% DMG',
    icon: '/assets/ui/profile/thor.webp',
    model: '/assets/characters/thor/Thor.glb'
  },
  {
    id: 'hulk',
    name: 'Hulk',
    class: 'Tank',
    hp: 180,
    maxHp: 180,
    atk: 30,
    ultThreshold: 100,
    ultType: 'take',
    ultName: 'Kinetic Bastion',
    ultDesc: 'Heal +40 HP & Reflect 50% DMG',
    icon: '/assets/ui/profile/hulk.webp',
    model: '/assets/characters/spiderman/spiderman.glb'
  },
  {
    id: 'captainamerica',
    name: 'Captain America',
    class: 'Tank',
    hp: 180,
    maxHp: 180,
    atk: 30,
    ultThreshold: 100,
    ultType: 'take',
    ultName: 'Kinetic Bastion',
    ultDesc: 'Shield Reflect & Heal +40 HP',
    icon: '/assets/ui/profile/captainamerica.webp',
    model: '/assets/characters/spiderman/spiderman.glb'
  },
  {
    id: 'blackpanther',
    name: 'Black Panther',
    class: 'Fighter',
    hp: 120,
    maxHp: 120,
    atk: 50,
    ultThreshold: 100,
    ultType: 'deal',
    ultName: 'Overdrive',
    ultDesc: '+30 ATK Kinetic Release',
    icon: '/assets/ui/profile/blackpanther.webp',
    model: '/assets/characters/spiderman/spiderman.glb'
  },
  {
    id: 'doctorstrange',
    name: 'Doctor Strange',
    class: 'Support',
    hp: 100,
    maxHp: 100,
    atk: 35,
    ultThreshold: 60,
    ultType: 'take',
    ultName: 'Avengers Assemble!',
    ultDesc: 'Field 2 Active Heroes for 1 turn',
    icon: '/assets/ui/profile/doctorstrange.webp',
    model: '/assets/characters/spiderman/spiderman.glb'
  },
  {
    id: 'mantis',
    name: 'Mantis',
    class: 'Support',
    hp: 100,
    maxHp: 100,
    atk: 35,
    ultThreshold: 60,
    ultType: 'take',
    ultName: 'Avengers Assemble!',
    ultDesc: 'Field 2 Active Heroes for 1 turn',
    icon: '/assets/ui/profile/mantis.webp',
    model: '/assets/characters/spiderman/spiderman.glb'
  },
  {
    id: 'invisiblewoman',
    name: 'Invisible Woman',
    class: 'Support',
    hp: 100,
    maxHp: 100,
    atk: 35,
    ultThreshold: 60,
    ultType: 'take',
    ultName: 'Avengers Assemble!',
    ultDesc: 'Field 2 Active Heroes for 1 turn',
    icon: '/assets/ui/profile/invisiblewoman.webp',
    model: '/assets/characters/spiderman/spiderman.glb'
  }
];

export function cloneHero(heroId) {
  const template = HEROES_LIST.find(h => h.id === heroId) || HEROES_LIST[0];
  return {
    ...template,
    currentHp: template.hp,
    currentMeter: 0,
    isFainted: false,
    kineticBastionActive: false,
    overdriveActive: false
  };
}
