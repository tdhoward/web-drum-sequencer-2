type MockAudioParam = {
  value: number;
  setValueAtTime: jest.Mock<void, [number, number]>;
  cancelScheduledValues: jest.Mock<void, [number]>;
  linearRampToValueAtTime: jest.Mock<void, [number, number]>;
};

type MockConnectableNode<TExtra extends object = object> = TExtra & {
  connect: jest.Mock;
  disconnect: jest.Mock;
};

type MockGainNode = MockConnectableNode<{
  gain: MockAudioParam;
}>;

type MockStereoPannerNode = MockConnectableNode<{
  pan: MockAudioParam;
}>;

type MockPannerNode = MockConnectableNode<{
  panningModel: string | null;
  setPosition: jest.Mock<void, [number, number, number]>;
}>;

type MockAnalyserNode = MockConnectableNode<{
  smoothingTimeConstant: number | null;
}>;

type MockConvolverNode = MockConnectableNode<{
  buffer: AudioBuffer | null;
}>;

type MockAudioBufferSourceNode = MockConnectableNode<{
  buffer: AudioBuffer | null;
  detune: MockAudioParam;
  onended: (() => void) | null;
  start: jest.Mock<void, [number?]>;
  stop: jest.Mock<void, [number]>;
}>;

type MockAudioContext = {
  currentTime: number;
  destination: object;
  gainNodes: MockGainNode[];
  sources: MockAudioBufferSourceNode[];
  createGain: jest.Mock<MockGainNode, []>;
  createStereoPanner: jest.Mock<MockStereoPannerNode, []>;
  createPanner: jest.Mock<MockPannerNode, []>;
  createAnalyser: jest.Mock<MockAnalyserNode, []>;
  createConvolver: jest.Mock<MockConvolverNode, []>;
  createBufferSource: jest.Mock<MockAudioBufferSourceNode, []>;
};

let mockAudioContext: MockAudioContext;

const createAudioParam = (initialValue = 0) => ({
  value: initialValue,
  setValueAtTime: jest.fn(function setValueAtTime(
    this: MockAudioParam,
    value: number,
    startTime: number,
  ) {
    void startTime;
    this.value = value;
  }),
  cancelScheduledValues: jest.fn(),
  linearRampToValueAtTime: jest.fn(function linearRampToValueAtTime(
    this: MockAudioParam,
    value: number,
    endTime: number,
  ) {
    void endTime;
    this.value = value;
  }),
} as MockAudioParam);

const createConnectableNode = <TExtra extends object>(
  extraProps: TExtra,
): MockConnectableNode<TExtra> => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  ...extraProps,
});

const createMockAudioContext = (): MockAudioContext => {
  const context = {
    currentTime: 10,
    destination: {},
    gainNodes: [] as MockGainNode[],
    sources: [] as MockAudioBufferSourceNode[],
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

  return context as MockAudioContext;
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
      const { playNote, stopAllNotes } = jest.requireActual<typeof import('./audioRouter')>(
        './audioRouter',
      );
      const buffer = {} as AudioBuffer;

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

  test('applies per-note velocity to the voice gain node', () => {
    jest.isolateModules(() => {
      const { playNote } = jest.requireActual<typeof import('./audioRouter')>(
        './audioRouter',
      );
      const buffer = {} as AudioBuffer;

      playNote(12, buffer, 'kick', 0, 0.42);

      const voiceGainNode = mockAudioContext.gainNodes[mockAudioContext.gainNodes.length - 1];

      expect(voiceGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.42, 10);
    });
  });
});
