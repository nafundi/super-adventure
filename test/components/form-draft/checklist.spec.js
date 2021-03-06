import { RouterLinkStub } from '@vue/test-utils';

import ChecklistStep from '../../../src/components/checklist-step.vue';
import FormDraftChecklist from '../../../src/components/form-draft/checklist.vue';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = (options) => mount(FormDraftChecklist, {
  propsData: { status: options.mocks.$route.endsWith('/draft') },
  requestData: {
    form: testData.extendedForms.last(),
    formDraft: testData.extendedFormDrafts.last(),
    attachments: testData.standardFormAttachments.sorted()
  },
  stubs: { RouterLink: RouterLinkStub },
  ...options
});

describe('FormDraftChecklist', () => {
  beforeEach(mockLogin);

  describe('Upload initial Form definition', () => {
    it('is shown for a form without a published version', () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1);
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f/draft' }
      });
      checklist.findAllComponents(ChecklistStep).length.should.equal(5);
    });

    it('is not shown for a form with a published version', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1);
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f/draft' }
      });
      checklist.findAllComponents(ChecklistStep).length.should.equal(4);
    });

    it('is marked as complete', () => {
      testData.extendedForms.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1);
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f/draft' }
      });
      const { stage } = checklist.getComponent(ChecklistStep).props();
      stage.should.equal('complete');
    });
  });

  describe('Upload revised Form definition', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
    });

    it('is marked as a current step', () => {
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f/draft' }
      });
      const { stage } = checklist.getComponent(ChecklistStep).props();
      stage.should.equal('current');
    });

    it('links to .../draft from the form overview', () => {
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f' }
      });
      const step = checklist.getComponent(ChecklistStep);
      const { to } = step.getComponent(RouterLinkStub).props();
      to.should.equal('/projects/1/forms/f/draft');
    });

    it('does not link to .../draft from .../draft', () => {
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f/draft' }
      });
      const step = checklist.getComponent(ChecklistStep);
      step.findComponent(RouterLinkStub).exists().should.be.false();
    });
  });

  describe('Upload Form Media Files', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
    });

    it('is shown if the draft has an attachment', () => {
      testData.standardFormAttachments.createPast(1);
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f/draft' }
      });
      checklist.findAllComponents(ChecklistStep).length.should.equal(4);
    });

    it('is not shown if the form draft does not have an attachment', () => {
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f/draft' }
      });
      checklist.findAllComponents(ChecklistStep).length.should.equal(3);
    });

    it('is marked as complete if all attachments exist', () => {
      testData.standardFormAttachments.createPast(1, { exists: true });
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f/draft' }
      });
      const step = checklist.findAllComponents(ChecklistStep).at(1);
      step.props().stage.should.equal('complete');
    });

    it('is marked as a current step if an attachment is missing', () => {
      testData.standardFormAttachments
        .createPast(1, { exists: true })
        .createPast(1, { exists: false });
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f/draft' }
      });
      const step = checklist.findAllComponents(ChecklistStep).at(1);
      step.props().stage.should.equal('current');
    });
  });

  describe('Test the Form on your mobile device', () => {
    it('is marked as complete if the draft has a submission', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, {
        draft: true,
        submissions: 1
      });
      testData.standardFormAttachments.createPast(1);
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f/draft' }
      });
      const step = checklist.findAllComponents(ChecklistStep).at(2);
      step.props().stage.should.equal('complete');
    });

    it('is marked as a current step if draft does not have a submission', () => {
      testData.extendedForms.createPast(1, { submissions: 1 });
      testData.extendedFormVersions.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1);
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f/draft' }
      });
      const step = checklist.findAllComponents(ChecklistStep).at(2);
      step.props().stage.should.equal('current');
    });
  });

  describe('Publish the Draft', () => {
    beforeEach(() => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      testData.standardFormAttachments.createPast(1);
    });

    it('is marked as a current step', () => {
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f/draft' }
      });
      const step = checklist.findAllComponents(ChecklistStep).at(3);
      step.props().stage.should.equal('current');
    });

    it('links to .../draft from the form overview', () => {
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f' }
      });
      const step = checklist.findAllComponents(ChecklistStep).at(3);
      const { to } = step.getComponent(RouterLinkStub).props();
      to.should.equal('/projects/1/forms/f/draft');
    });

    it('does not link to .../draft from .../draft', () => {
      const checklist = mountComponent({
        mocks: { $route: '/projects/1/forms/f/draft' }
      });
      const step = checklist.findAllComponents(ChecklistStep).at(3);
      step.findComponent(RouterLinkStub).exists().should.be.false();
    });
  });
});
