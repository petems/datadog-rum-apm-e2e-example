module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 72],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'body-bullet-star-limit': [2, 'always', 5],
  },
  plugins: [
    {
      rules: {
        'body-bullet-star-limit': (parsed, when = 'always', value = 5) => {
          const { body } = parsed || {};
          if (!body || body.trim() === '') {
            return [true];
          }
          const lines = body.split(/\r?\n/);
          const nonEmpty = lines.filter(l => l.trim() !== '');
          const starLines = nonEmpty.filter(l => /^\*\s/.test(l));
          const allAreStar = starLines.length === nonEmpty.length;
          const limitOk = starLines.length <= value;
          const pass =
            when === 'always'
              ? allAreStar && limitOk
              : !(allAreStar && limitOk);
          let msg = '';
          if (!allAreStar) {
            const bad = nonEmpty
              .filter(l => !/^\*\s/.test(l))
              .slice(0, 3)
              .map(l => `"${l.slice(0, 40)}"`)
              .join(', ');
            msg += 'Body must be bullet lines starting with "* ". ';
            if (bad) {
              msg += `Non-bullet lines: ${bad}. `;
            }
          }
          if (!limitOk) {
            msg += `Body must have no more than ${value} bullet lines.`;
          }
          return [pass, msg.trim()];
        },
      },
    },
  ],
};
