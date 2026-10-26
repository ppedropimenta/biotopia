export const en = {
  app: {
    name: 'aquarium',
  },
  nav: {
    credits: 'Credits',
  },
  language: {
    label: 'Language',
  },
  home: {
    title: 'Your aquarium’s logbook',
    lead: 'Water tests, maintenance and dated photos of each tank, kept together over the months.',
    status: 'Still being built. The demo tank opens here soon.',
    hero: {
      alt: 'Tea-coloured blackwater running over flat rock, with forest on the far bank',
      caption: 'Blackwater over rock. Cachoeira das Lajes, Presidente Figueiredo, Amazonas',
    },
    logged: {
      title: 'What goes in the logbook',
      neonAlt: 'A neon tetra, blue stripe over red, among green plants',
      neonCaption: 'Paracheirodon innesi, the neon tetra',
      parameters: {
        figure: '11',
        label: 'water parameters',
        note: 'Temperature, pH, hardness, ammonia, nitrite, nitrate, phosphate, iron, potassium and more, each with its own chart.',
      },
      maintenance: {
        figure: '7',
        label: 'kinds of maintenance',
        note: 'Water changes, top-ups, filter cleaning and pruning, marked on the charts.',
      },
      photos: {
        figure: '200 MB',
        label: 'of tank photos',
        note: 'Dated, so you can see the tank change from month to month.',
      },
    },
    notes: {
      title: 'Kept like a naturalist’s notes',
      text: 'Every measurement gets a date, a time and, if you like, a note. Every photo gets the day it was taken. Over the months the logbook shows what no single test can.',
      plateAlt: 'Hand-coloured 1856 plate of the fish Geophagus obscurus',
      plateCaption: 'Geophagus obscurus. Castelnau, 1856',
      igapoAlt: 'Flooded forest on the Rio Negro, with giant water lily pads on brown water',
      igapoCaption: 'Igapó, flooded forest on the Rio Negro, with giant water lilies',
    },
  },
  credits: {
    title: 'Credits and licences',
    intro:
      'Pictures and data made by other people are listed here with their licence. This site is free and has no ads.',
    pictures: 'Pictures',
    by: 'By',
    licence: 'Licence',
    source: 'Source',
    publicDomain: 'Public domain',
  },
  footer: {
    about: 'A logbook for aquariums',
    credits: 'Credits and licences',
  },
}

export type Messages = typeof en
