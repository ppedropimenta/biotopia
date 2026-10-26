import type { Messages } from './en'

export const ptBR: Messages = {
  app: {
    name: 'aquarium',
  },
  nav: {
    credits: 'Créditos',
    login: 'Entrar',
    signup: 'Criar conta',
    logout: 'Sair',
    tanks: 'Seus aquários',
  },
  language: {
    label: 'Idioma',
  },
  home: {
    title: 'O diário do seu aquário',
    lead: 'Testes de água, manutenções e fotos datadas de cada aquário, guardados juntos ao longo dos meses.',
    status: 'Ainda em construção. O aquário de demonstração abre aqui em breve.',
    cta: 'Criar uma conta',
    hero: {
      alt: 'Água preta, cor de chá, correndo sobre pedra lisa, com a mata na outra margem',
      caption: 'Água preta sobre a pedra. Cachoeira das Lajes, Presidente Figueiredo, Amazonas',
    },
    logged: {
      title: 'O que vai no diário',
      neonAlt: 'Um neon, com a faixa azul sobre o vermelho, entre plantas verdes',
      neonCaption: 'Paracheirodon innesi, o neon',
      parameters: {
        figure: '11',
        label: 'parâmetros da água',
        note: 'Temperatura, pH, dureza, amônia, nitrito, nitrato, fosfato, ferro, potássio e mais, cada um com seu gráfico.',
      },
      maintenance: {
        figure: '7',
        label: 'tipos de manutenção',
        note: 'Trocas de água, reposição, limpeza de filtro e poda, marcadas nos gráficos.',
      },
      photos: {
        figure: '200 MB',
        label: 'para fotos do aquário',
        note: 'Datadas, para você ver o aquário mudar de um mês para o outro.',
      },
    },
    notes: {
      title: 'Anotado como um naturalista',
      text: 'Cada medição leva data, hora e, se você quiser, uma nota. Cada foto leva o dia em que foi tirada. Com os meses, o diário mostra o que nenhum teste sozinho mostra.',
      plateAlt: 'Prancha colorida à mão, de 1856, do peixe Geophagus obscurus',
      plateCaption: 'Geophagus obscurus. Castelnau, 1856',
      igapoAlt: 'Mata alagada no Rio Negro, com folhas de vitória-régia sobre a água escura',
      igapoCaption: 'Igapó no Rio Negro, com vitórias-régias',
    },
  },
  auth: {
    email: 'E-mail',
    password: 'Senha',
    working: 'Um instante…',
    signup: {
      title: 'Comece o seu diário',
      lead: 'Uma conta mantém seus aquários privados, e iguais em todos os aparelhos.',
      passwordHint: 'Pelo menos 8 caracteres.',
      submit: 'Criar conta',
      haveAccount: 'Já tem conta?',
      photoAlt: 'Um neon, com a faixa azul sobre o vermelho, entre plantas verdes',
      photoCaption: 'Paracheirodon innesi, o neon',
    },
    sent: {
      title: 'Veja seu e-mail',
      text: 'Enviamos um link para {{email}}. Abra-o para confirmar o endereço e depois entre.',
      resend: 'Enviar o link de novo',
      resent: 'Enviado de novo. Pode levar um minuto para chegar.',
    },
    login: {
      title: 'Bem-vindo de volta',
      lead: 'Entre para ver seus aquários.',
      submit: 'Entrar',
      noAccount: 'Ainda não tem conta?',
      unconfirmed: 'Seu e-mail ainda não foi confirmado. Abra o link que enviamos ou peça um novo.',
      photoAlt: 'Água preta, cor de chá, correndo sobre pedra lisa, com a mata na outra margem',
      photoCaption: 'Água preta sobre a pedra. Cachoeira das Lajes, Amazonas',
    },
    confirm: {
      working: 'Confirmando o seu e-mail…',
      doneTitle: 'E-mail confirmado',
      doneText: 'Sua conta está pronta.',
      failedTitle: 'Este link não funciona',
      failedText:
        'Ele já foi usado ou expirou. Se você já confirmou, entre. Se não, tente entrar e peça um link novo ali.',
    },
    errors: {
      invalid_credentials: 'Esse e-mail e essa senha não conferem.',
      email_taken: 'Este e-mail já tem conta. Entre com ela.',
      email_invalid: 'Digite um e-mail válido.',
      password_too_short: 'Use pelo menos 8 caracteres.',
      password_too_long: 'Use no máximo 72 caracteres.',
      login_incomplete: 'Digite o seu e-mail e a sua senha.',
      generic: 'Algo deu errado. Tente de novo em instantes.',
    },
  },
  tanks: {
    title: 'Seus aquários',
    empty: 'Nenhum aquário ainda. Adicionar o primeiro chega em breve.',
  },
  credits: {
    title: 'Créditos e licenças',
    intro:
      'Imagens e dados feitos por outras pessoas aparecem aqui com a sua licença. Este site é gratuito e não tem anúncios.',
    pictures: 'Imagens',
    by: 'Autor',
    licence: 'Licença',
    source: 'Fonte',
    publicDomain: 'Domínio público',
  },
  footer: {
    about: 'Um diário para aquários',
    credits: 'Créditos e licenças',
  },
}
