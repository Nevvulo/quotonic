const { inject } = require('powercord/injector');
const { React, getModuleByDisplayName, messages: { jumpToMessage } } = require('powercord/webpack');

module.exports = async function () {
  const MessageContent = await getModuleByDisplayName('MessageContent');
  const Image = await getModuleByDisplayName('Image');

  inject('quotonic-attachment', Image.prototype, 'render', (_, res) => {
    if (res.props.href && res.props.href.includes('quotonic-')) {
      res.props.className += ' quotonic-quote-img';
    }

    return res;
  });

  inject('quotonic-message', MessageContent.prototype, 'render', function (_, res) {
    const { children } = res.props;
    const { message } = this.props;

    res.props.children = function (e) {
      const res = children(e);
      const compact = res.props.className.includes('containerCompact');
      for (const attachment of message.attachments.filter(c => c.filename.includes('quotonic-'))) {
        let [ header, channel, msgid ] = attachment.filename.split('-'); // eslint-disable-line no-unused-vars
        msgid = msgid.replace('.png', '');
        if (!header || !channel || !msgid) {
          continue;
        }
        res.props.children = res.props.children.concat([
          React.createElement('div', { className: compact ? 'quotonic-quote-header-container-compact' : 'quotonic-quote-header-container' }, [
            React.createElement('header', { className: 'quotonic-quote-header' }, 'Quotonic Quote'),
            React.createElement('div', { className: 'quotonic-quote-options' }, [
              React.createElement('a', { className: 'quotonic-quote-jumplink',
                onClick: () => jumpToMessage(channel, msgid) }, 'Jump') // eslint-disable-line new-cap
            ])
          ])
        ]);
      }

      return res;
    };

    return res;
  });
};

