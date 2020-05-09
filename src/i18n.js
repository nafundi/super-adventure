/*
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import VueI18n from 'vue-i18n';
// Bundle en messages, since en is the fallback locale, then load any other
// locales asynchronously.
import fallbackMessages from './locales/en.json';

const fallbackLocale = 'en';

export default new VueI18n({
  locale: fallbackLocale,
  fallbackLocale,
  messages: { [fallbackLocale]: fallbackMessages },
  warnHtmlInMessage: 'error',
  silentFallbackWarn: true
});
