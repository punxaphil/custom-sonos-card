import { getWidth } from '../src/utils/utils';

describe('utils', () => {
  it.each`
    innerWidth | defaultWidth | defaultMobileWidth | size                      | expected
    ${1000}    | ${'30%'}     | ${'50%'}           | ${null}                   | ${'30%'}
    ${500}     | ${'30%'}     | ${'50%'}           | ${null}                   | ${'50%'}
    ${1000}    | ${'30%'}     | ${'50%'}           | ${{ width: '10%' }}       | ${'10%'}
    ${500}     | ${'30%'}     | ${'50%'}           | ${{ mobileWidth: '70%' }} | ${'70%'}
  `(
    "should getWidth '$expected' if innerWidth '$innerWidth' and size '$size'",
    async ({ innerWidth, defaultWidth, defaultMobileWidth, size, expected }) => {
      global = Object.assign(global, { innerWidth });

      const width = getWidth({ type: 'custom:custom-sonos-card' }, defaultWidth, defaultMobileWidth, size);
      expect(width).toEqual(expected);
    },
  );
});
