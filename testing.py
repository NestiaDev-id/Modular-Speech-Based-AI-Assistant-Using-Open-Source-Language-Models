import wave

obj = wave.open('datasets/16000/test01_20s.wav','rb')

print("Number of channels:",obj.getnchannels())
print("Sample width:",obj.getsampwidth())
print("Frame rate:",obj.getframerate())
print("Number of frames:",obj.getnframes())
print("Parameters:",obj.getparams())

t_audio = obj.getnframes()/obj.getframerate()
print("Total time duration:",t_audio,"seconds")

frames = obj.readframes(-1)
print("Type of frames:",type(frames), type(frames[0]))
print("Length of frames:",len(frames))