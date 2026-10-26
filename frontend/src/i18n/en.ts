export const en = {
  app: {
    name: 'aquarium',
  },
  nav: {
    credits: 'Credits',
    login: 'Log in',
    signup: 'Sign up',
    logout: 'Log out',
    tanks: 'Your tanks',
  },
  language: {
    label: 'Language',
  },
  home: {
    title: 'Your aquarium’s logbook',
    lead: 'Water tests, maintenance and dated photos of each tank, kept together over the months.',
    status: 'Still being built. The demo tank opens here soon.',
    cta: 'Create an account',
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
  auth: {
    email: 'Email',
    password: 'Password',
    working: 'One moment…',
    signup: {
      title: 'Start your logbook',
      lead: 'An account keeps your tanks private, and the same on every device.',
      passwordHint: 'At least 8 characters.',
      submit: 'Create account',
      haveAccount: 'Already have an account?',
      photoAlt: 'A neon tetra, blue stripe over red, among green plants',
      photoCaption: 'Paracheirodon innesi, the neon tetra',
    },
    sent: {
      title: 'Check your email',
      text: 'We sent a link to {{email}}. Open it to confirm your address, then log in.',
      resend: 'Send the link again',
      resent: 'Sent again. It can take a minute to arrive.',
    },
    login: {
      title: 'Welcome back',
      lead: 'Log in to your tanks.',
      submit: 'Log in',
      forgot: 'Forgot your password?',
      noAccount: 'No account yet?',
      unconfirmed: 'Your email is not confirmed yet. Open the link we sent you, or ask for a new one.',
      photoAlt: 'Tea-coloured blackwater running over flat rock, with forest on the far bank',
      photoCaption: 'Blackwater over rock. Cachoeira das Lajes, Amazonas',
    },
    forgot: {
      title: 'Forgot your password?',
      lead: 'Enter your email and we will send a link to choose a new one.',
      submit: 'Send the link',
      sentTitle: 'Check your email',
      sentText:
        'If {{email}} has an account, we sent a link to choose a new password. It works once and expires in 1 hour.',
    },
    reset: {
      title: 'Choose a new password',
      lead: 'Then log in with it.',
      submit: 'Save password',
      doneTitle: 'Password changed',
      doneText: 'You can log in with your new password now.',
      failedTitle: 'This link does not work',
      failedText: 'It was already used or has expired. Ask for a new one.',
      askAgain: 'Ask for a new link',
    },
    confirm: {
      working: 'Confirming your email…',
      doneTitle: 'Email confirmed',
      doneText: 'Your account is ready.',
      failedTitle: 'This link does not work',
      failedText:
        'It was already used or has expired. If you have confirmed already, log in. If not, try to log in and ask for a new link there.',
    },
    errors: {
      invalid_credentials: 'That email and password do not match.',
      email_taken: 'This email already has an account. Log in instead.',
      email_invalid: 'Enter a valid email address.',
      password_too_short: 'Use at least 8 characters.',
      password_too_long: 'Use at most 72 characters.',
      login_incomplete: 'Enter your email and your password.',
      generic: 'Something went wrong. Try again in a moment.',
    },
  },
  tanks: {
    title: 'Your tanks',
    empty: 'No tanks yet. Adding the first one is coming soon.',
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
