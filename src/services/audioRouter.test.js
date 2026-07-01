/* global require */
let mockAudioContext;

const createAudioParam = (initialValue = 0) => ({
  value: initialValue,
  setValueAtTime: jest.fn(function setValueAtTime(value) {
    this.value = value;
  }),
  cancelScheduledValues: jest.fn(),
  linearRampToValueAtTime: jest.fn(function linearRampToValueAtTime(value) {
    this.value = value;
  }),
});

const createConnectableNode = extraProps => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  ...extraProps,
});

const createMockAudioContext = () => {
  const context = {
    currentTime: 10,
    destination: {},
    gainNodes: [],
    sources: [],
    createGain: jest.fn(() => {
      const gainNode = createConnectableNode({
        gain: createAudioParam(1),
      });
      context.gainNodes.push(gainNode);
      return gainNode;
    }),
    createStereoPanner: jest.fn(() => createConnectableNode({
      pan: createAudioParam(0),
    })),
    createPanner: jest.fn(() => createConnectableNode({
      panningModel: null,
      setPosition: jest.fn(),
    })),
    createAnalyser: jest.fn(() => createConnectableNode({
      smoothingTimeConstant: null,
    })),
    createConvolver: jest.fn(() => createConnectableNode({
      buffer: null,
    })),
    createBufferSource: jest.fn(() => {
      const source = createConnectableNode({
        buffer: null,
        detune: createAudioParam(0),
        onended: null,
        start: jest.fn(),
        stop: jest.fn(),
      });
      context.sources.push(source);
      return source;
    }),
  };

  return context;
};

jest.mock('./audioContext', () => ({
  getAudioContext: () => mockAudioContext,
}));

jest.mock('./featureChecks', () => ({
  detuneSupported: true,
  stereoPannerSupported: true,
}));

jest.mock('./reverb', () => ({
  loadImpulseResponse: jest.fn(() => Promise.resolve(null)),
}));

describe('audioRouter', () => {
  beforeEach(() => {
    jest.resetModules();
    mockAudioContext = createMockAudioContext();
  });

  test('fades active voices before stopping them', () => {
    jest.isolateModules(() => {
      const { playNote, stopAllNotes } = require('./audioRouter');
      const buffer = {};

      playNote(12, buffer, 'kick', 0);
      stopAllNotes();

      const source = mockAudioContext.sources[0];
      const voiceGainNode = mockAudioContext.gainNodes[mockAudioContext.gainNodes.length - 1];

      expect(voiceGainNode.gain.cancelScheduledValues).toHaveBeenCalledWith(10);
      expect(voiceGainNode.gain.setValueAtTime).toHaveBeenCalledWith(1, 10);
      expect(voiceGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 10.03);
      expect(source.stop).toHaveBeenCalledWith(10.03);
    });
  });
});
