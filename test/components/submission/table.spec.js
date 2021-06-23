import { RouterLinkStub } from '@vue/test-utils';

import SubmissionDataRow from '../../../src/components/submission/data-row.vue';
import SubmissionMetadataRow from '../../../src/components/submission/metadata-row.vue';
import SubmissionTable from '../../../src/components/submission/table.vue';

import Field from '../../../src/presenters/field';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = (mountOptions = {}) => mount(SubmissionTable, {
  ...mountOptions,
  propsData: {
    projectId: '1',
    xmlFormId: 'f',
    draft: false,
    submissions: testData.submissionOData().value,
    fields: testData.extendedForms.last()._fields
      .map(field => new Field(field)),
    originalCount: testData.extendedSubmissions.size,
    ...mountOptions.propsData
  },
  requestData: { project: testData.extendedProjects.last() },
  stubs: { RouterLink: RouterLinkStub }
});

const headers = (table) => table.findAll('th').wrappers.map(th => th.text());

describe('SubmissionTable', () => {
  describe('metadata headers', () => {
    it('renders the correct headers for a form', () => {
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent({
        propsData: { draft: false }
      });
      const table = component.get('#submission-table-metadata');
      headers(table).should.eql(['', 'Submitted by', 'Submitted at', 'State and actions']);
    });

    it('renders the correct headers for a form draft', () => {
      testData.extendedForms.createPast(1, { draft: true, submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent({
        propsData: { draft: true }
      });
      const table = component.get('#submission-table-metadata');
      headers(table).should.eql(['', 'Submitted at']);
    });
  });

  describe('field headers', () => {
    it('shows a header for each field', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.string('/s1'), testData.fields.string('/s2')],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1);
      const table = mountComponent().get('#submission-table-data');
      headers(table).should.eql(['s1', 's2', 'Instance ID']);
    });

    it('shows the group name in the header', () => {
      const fields = [
        testData.fields.group('/g'),
        testData.fields.string('/g/s')
      ];
      testData.extendedForms.createPast(1, { fields, submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent({
        propsData: { fields: [new Field(fields[1])] }
      });
      const table = component.get('#submission-table-data');
      headers(table).should.eql(['g-s', 'Instance ID']);
    });
  });

  it('renders the correct number of rows', () => {
    testData.extendedForms.createPast(1, { submissions: 2 });
    testData.extendedSubmissions.createPast(2);
    const component = mountComponent();
    component.findAllComponents(SubmissionMetadataRow).length.should.equal(2);
    component.findAllComponents(SubmissionDataRow).length.should.equal(2);
  });

  it('passes the correct rowNumber prop to SubmissionMetadataRow', () => {
    // Create 10 submissions (so that the count is 10), then pass two to the
    // component (as if $top was 2).
    testData.extendedForms.createPast(1, { submissions: 10 });
    testData.extendedSubmissions.createPast(10);
    const component = mountComponent({
      propsData: { submissions: testData.submissionOData(2).value }
    });
    const rows = component.findAllComponents(SubmissionMetadataRow);
    rows.length.should.equal(2);
    rows.at(0).props().rowNumber.should.equal(10);
    rows.at(1).props().rowNumber.should.equal(9);
  });

  describe('canUpdate prop of SubmissionMetadataRow', () => {
    it('passes true if the user can submission.update', () => {
      mockLogin();
      testData.extendedSubmissions.createPast(1);
      const row = mountComponent().getComponent(SubmissionMetadataRow);
      row.props().canUpdate.should.be.true();
    });

    it('passes false if the user cannot submission.update', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedSubmissions.createPast(1);
      const row = mountComponent().getComponent(SubmissionMetadataRow);
      row.props().canUpdate.should.be.false();
    });
  });

  describe('visibility of actions', () => {
    it('shows actions if user hovers over a SubmissionDataRow', async () => {
      testData.extendedForms.createPast(1, { submissions: 2 });
      testData.extendedSubmissions.createPast(2);
      const component = mountComponent();
      await component.getComponent(SubmissionDataRow).trigger('mouseover');
      const metadataRows = component.findAllComponents(SubmissionMetadataRow);
      metadataRows.at(0).classes('data-hover').should.be.true();
      metadataRows.at(1).classes('data-hover').should.be.false();
    });

    it('toggles actions if user hovers over a new SubmissionDataRow', async () => {
      testData.extendedForms.createPast(1, { submissions: 2 });
      testData.extendedSubmissions.createPast(2);
      const component = mountComponent();
      const dataRows = component.findAllComponents(SubmissionDataRow);
      await dataRows.at(0).trigger('mouseover');
      await dataRows.at(1).trigger('mouseover');
      const metadataRows = component.findAllComponents(SubmissionMetadataRow);
      metadataRows.at(0).classes('data-hover').should.be.false();
      metadataRows.at(1).classes('data-hover').should.be.true();
    });

    it('hides the actions if the cursor leaves the table', async () => {
      testData.extendedForms.createPast(1, { submissions: 2 });
      testData.extendedSubmissions.createPast(2);
      const component = mountComponent();
      await component.getComponent(SubmissionDataRow).trigger('mouseover');
      await component.get('#submission-table-data tbody').trigger('mouseleave');
      const metadataRow = component.getComponent(SubmissionMetadataRow);
      metadataRow.classes('data-hover').should.be.false();
    });

    it('adds a class for the actions trigger', async () => {
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent({ attachTo: document.body });
      const tbody = component.get('#submission-table-metadata tbody');
      tbody.classes('submission-table-actions-trigger-hover').should.be.true();
      const btn = tbody.findAll('.btn');
      await btn.at(0).trigger('focus');
      tbody.classes('submission-table-actions-trigger-focus').should.be.true();
      await component.getComponent(SubmissionMetadataRow).trigger('mousemove');
      tbody.classes('submission-table-actions-trigger-hover').should.be.true();
      await btn.at(1).trigger('focus');
      await component.getComponent(SubmissionDataRow).trigger('mousemove');
      tbody.classes('submission-table-actions-trigger-hover').should.be.true();
    });
  });
});
