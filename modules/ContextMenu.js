const { inject } = require('powercord/injector');
const { sleep } = require('powercord/util');
const { ContextMenu: { Submenu } } = require('powercord/components');
const { React, getModuleByDisplayName } = require('powercord/webpack');

module.exports = async function () {
  const _this = this;
  const MessageContextMenu = await getModuleByDisplayName('MessageContextMenu');

  inject('quotonic-context-menu', MessageContextMenu.prototype, 'render', function (_, res) {
    let { target } = this.props;

    /*
     * Set the target to the highest element until we reach `containerCozy` so that
     * images and emojis can work as well
     */
    const setTarget = () => {
      do {
        if (target.matches('.pc-containerCozy')) {
          return target;
        }
        target = target.parentElement || target.parentNode;
      } while (target !== null && target.nodeType === 1);
    };
    setTarget();

    if (target !== document) {
      const perform = async (sendToChannel = true) => {
        const messages = [ ...target.parentElement.parentElement.parentElement.children ]
          .filter(n => n.nodeName !== 'HR');
        const firstMessage = messages[0];

        // Hide any unnecessary messages for the screenshot
        target.style.minWidth = '270px';
        target.style.width = 'min-content';
        if (messages.length > 1) {
          if (target.parentElement.parentElement !== firstMessage) {
            firstMessage.children[1].style.display = 'none';
          }

          for (const message of messages) {
            if (message !== target.parentElement.parentElement && message !== firstMessage) {
              message.style.display = 'none';
            }
          }
        }

        // Get position data for element
        const rect = target.getBoundingClientRect();
        // Take screenshot
        const screenshot = _this.getModule('Screenshot');
        screenshot(rect, sendToChannel);

        document.body.click();
        // Wait a little bit before reverting changes
        await sleep(200);

        // Change all modified messages back to normal
        target.style.minWidth = '';
        target.style.width = '';
        if (messages.length > 1) {
          firstMessage.children[1].style.display = '';
          for (const message of messages) {
            if (message !== target.parentElement.parentElement) {
              message.style.display = '';
            }
          }
        }
      };
      res.props.children.push(
        React.createElement(Submenu, {
          name: 'Quote',
          hint: 'to',
          onClick: () => perform(true),
          getItems: () => [
            {
              name: 'this channel',
              type: 'button',
              onClick: () => perform(true)
            },
            {
              name: 'clipboard',
              type: 'button',
              onClick: () => perform(false)
            }
          ]
        }),
      );
    }

    return res;
  });
};
