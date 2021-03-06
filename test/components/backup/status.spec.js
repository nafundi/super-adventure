import BackupStatus from '../../../src/components/backup/status.vue';
import DateTime from '../../../src/components/date-time.vue';
import Spinner from '../../../src/components/spinner.vue';

import testData from '../../data';
import { ago } from '../../../src/util/date-time';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(BackupStatus, {
  requestData: {
    backupsConfig: testData.standardBackupsConfigs.last(),
    audits: testData.standardAudits.sorted()
  }
});
const assertContent = (component, iconClass, title, buttonText) => {
  component.get('#backup-status-icon').classes(iconClass).should.be.true();

  const status = component.get('#backup-status');
  status.get('p').text().should.equal(title);

  status.get('button').text().should.equal(buttonText);
};

describe('BackupStatus', () => {
  beforeEach(mockLogin);

  it('renders correctly if backups are not configured', () => {
    const component = mount(BackupStatus, {
      requestData: {
        backupsConfig: { problem: 404.1 }
      }
    });
    assertContent(
      component,
      'icon-question-circle',
      'Backups are not configured.',
      'Set up now…'
    );
  });

  it('renders correctly if the latest recent attempt was a success', () => {
    const component = mount(BackupStatus, {
      requestData: {
        backupsConfig: testData.standardBackupsConfigs
          .createPast(1, { setAt: ago({ days: 4 }).toISO() })
          .last(),
        audits: testData.standardAudits
          .createBackupAudit({
            success: true,
            loggedAt: ago({ days: 2 }).toISO()
          })
          .sorted()
      }
    });

    assertContent(
      component,
      'icon-check-circle',
      'Backup is working.',
      'Terminate…'
    );

    const { loggedAt } = testData.extendedAudits.last();
    component.getComponent(DateTime).props().iso.should.equal(loggedAt);
  });

  it('renders correctly if the latest recent attempt was a failure', () => {
    const component = mount(BackupStatus, {
      requestData: {
        backupsConfig: testData.standardBackupsConfigs
          .createPast(1, { setAt: ago({ days: 2 }).toISO() })
          .last(),
        audits: testData.standardAudits
          .createBackupAudit({
            success: false,
            loggedAt: ago({ days: 1 }).toISO()
          })
          .sorted()
      }
    });
    assertContent(
      component,
      'icon-times-circle',
      'Something is wrong!',
      'Terminate…'
    );
  });

  describe('no recent attempt for the current config', () => {
    it('renders correctly if the config was recently set up', () => {
      const component = mount(BackupStatus, {
        requestData: {
          backupsConfig: testData.standardBackupsConfigs
            .createPast(1, { setAt: ago({ days: 2 }).toISO() })
            .last(),
          audits: []
        }
      });
      assertContent(
        component,
        'icon-check-circle',
        'The configured backup has not yet run.',
        'Terminate…'
      );
    });

    it('renders correctly if latest attempt was a recent failure for previous config', () => {
      const component = mount(BackupStatus, {
        requestData: {
          backupsConfig: testData.standardBackupsConfigs
            .createPast(1, { setAt: ago({ days: 1 }).toISO() })
            .last(),
          audits: testData.standardAudits
            .createBackupAudit({
              success: false,
              loggedAt: ago({ days: 2 }).toISO()
            })
            .sorted()
        }
      });
      assertContent(
        component,
        'icon-check-circle',
        'The configured backup has not yet run.',
        'Terminate…'
      );
    });

    it('renders correctly if the config was not recently set up', () => {
      const component = mount(BackupStatus, {
        requestData: {
          backupsConfig: testData.standardBackupsConfigs
            .createPast(1, { setAt: ago({ days: 4 }).toISO() })
            .last(),
          audits: []
        }
      });
      assertContent(
        component,
        'icon-times-circle',
        'Something is wrong!',
        'Terminate…'
      );
    });

    it('renders correctly if latest non-recent attempt was a success', () => {
      const component = mount(BackupStatus, {
        requestData: {
          backupsConfig: testData.standardBackupsConfigs
            .createPast(1, { setAt: ago({ days: 5 }).toISO() })
            .last(),
          audits: testData.standardAudits
            .createBackupAudit({
              success: true,
              loggedAt: ago({ days: 4 }).toISO()
            })
            .sorted()
        }
      });
      assertContent(
        component,
        'icon-times-circle',
        'Something is wrong!',
        'Terminate…'
      );
    });
  });

  describe('download link', () => {
    beforeEach(() => {
      testData.standardBackupsConfigs.createPast(1, {
        setAt: ago({ days: 1 }).toISO()
      });
    });

    it('renders the link if backups are configured', () => {
      mountComponent().find('[href="/v1/backup"]').exists().should.be.true();
    });

    describe('after the link is clicked', () => {
      let defaultPrevented;
      const handler = (event) => {
        defaultPrevented = event.defaultPrevented;
        event.preventDefault();
      };
      before(() => {
        document.addEventListener('click', handler);
      });
      after(() => {
        document.removeEventListener('click', handler);
      });

      it('shows a success alert', async () => {
        const app = await load('/system/backups', { attachTo: document.body });
        await app.get('#backup-status [href="/v1/backup"]').trigger('click');
        app.should.alert('success');
      });

      it('disables the link', async () => {
        const app = await load('/system/backups', { attachTo: document.body });
        const a = app.get('#backup-status [href="/v1/backup"]');
        await a.trigger('click');
        a.classes('disabled').should.be.true();
      });

      it('prevents default if it is clicked again', async () => {
        const app = await load('/system/backups', { attachTo: document.body });
        const a = app.get('#backup-status [href="/v1/backup"]');
        await a.trigger('click');
        defaultPrevented.should.be.false();
        a.trigger('click');
        defaultPrevented.should.be.true();
      });

      it('shows a spinner', async () => {
        const app = await load('/system/backups', { attachTo: document.body });
        const component = app.getComponent(BackupStatus);
        const spinners = component.findAllComponents(Spinner);
        spinners.length.should.equal(1);
        spinners.at(0).props().state.should.be.false();
        await component.get('[href="/v1/backup"]').trigger('click');
        spinners.at(0).props().state.should.be.true();
      });
    });
  });
});
