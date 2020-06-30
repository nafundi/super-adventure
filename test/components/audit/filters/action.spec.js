import AuditFiltersAction from '../../../../src/components/audit/filters/action.vue';
import TestUtilVModel from '../../../util/components/v-model.vue';
import { mount } from '../../../util/lifecycle';
import { trigger } from '../../../util/event';

const mountComponent = ({ value = 'nonverbose', parent = false } = {}) => {
  if (parent) {
    const component = mount(TestUtilVModel, {
      propsData: { component: AuditFiltersAction, value }
    });
    return component.first(AuditFiltersAction);
  }
  return mount(AuditFiltersAction, {
    propsData: { value }
  });
};

describe('AuditFiltersAction', () => {
  describe('options', () => {
    it('renders a category option correctly', () => {
      const option = mountComponent().first('option');
      option.text().trim().should.equal('(All Actions)');
      option.getAttribute('value').should.equal('nonverbose');
      option.hasClass('audit-filters-action-category').should.be.true();
    });

    it('renders an action option correctly', () => {
      const option = mountComponent().find('option')[2];
      option.text().should.containEql('\u00a0\u00a0\u00a0Create');
      option.getAttribute('value').should.equal('user.create');
      option.hasAttribute('class').should.be.false();
    });

    it('renders option correctly for an action with multiple periods', () => {
      const option = mountComponent().find('option')[14];
      option.text().should.containEql('\u00a0\u00a0\u00a0Create or Update Draft');
      option.getAttribute('value').should.equal('form.update.draft.set');
      option.hasAttribute('class').should.be.false();
    });
  });

  it('sets the value of the select element to the value prop', () => {
    const select = mountComponent({ value: 'user' }).first('select');
    select.element.value.should.equal('user');
  });

  it('emits an input event', () => {
    const component = mountComponent({ value: 'nonverbose', parent: true });
    return trigger.changeValue(component, 'select', 'user').then(() => {
      component.getProp('value').should.equal('user');
    });
  });
});
