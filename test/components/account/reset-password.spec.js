import { RouterLinkStub } from '@vue/test-utils';

import AccountResetPassword from '../../../src/components/account/reset-password.vue';

import { load, mockHttp } from '../../util/http';
import { mount } from '../../util/lifecycle';

describe('AccountResetPassword', () => {
  it('shows the proper page title', () =>
    load('/reset-password')
      .restoreSession(false)
      .afterResponse(() => {
        document.title.should.equal('Reset Password | ODK Central');
      }));

  it('focuses the input', () => {
    const component = mount(AccountResetPassword, {
      stubs: { RouterLink: RouterLinkStub },
      attachTo: document.body
    });
    component.get('input').should.be.focused();
  });

  it('sends the correct request', () =>
    mockHttp()
      .mount(AccountResetPassword, {
        stubs: { RouterLink: RouterLinkStub }
      })
      .request(async (component) => {
        await component.get('input').setValue('alice@getodk.org');
        return component.get('form').trigger('submit');
      })
      .beforeEachResponse((_, { method, url, data }) => {
        method.should.equal('POST');
        url.should.equal('/v1/users/reset/initiate');
        data.should.eql({ email: 'alice@getodk.org' });
      })
      .respondWithProblem());

  it('implement some standard button things', () =>
    mockHttp()
      .mount(AccountResetPassword, {
        stubs: { RouterLink: RouterLinkStub }
      })
      .testStandardButton({
        button: '.btn-primary',
        request: async (component) => {
          await component.get('input').setValue('alice@getodk.org');
          return component.get('form').trigger('submit');
        }
      }));

  describe('after a successful response', () => {
    const submit = () => load('/reset-password')
      .restoreSession(false)
      .complete()
      .request(async (app) => {
        const component = app.getComponent(AccountResetPassword);
        await component.get('input').setValue('alice@getodk.org');
        return component.get('form').trigger('submit');
      })
      .respondWithSuccess();

    it('redirects to login', async () => {
      const app = await submit();
      app.vm.$route.path.should.equal('/login');
    });

    it('shows a success alert', async () => {
      const app = await submit();
      app.should.alert('success');
    });
  });
});
