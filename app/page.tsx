'use client';

import Image from 'next/image'

import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import WaveSurfer from 'wavesurfer.js';

class SimpleEqualizer {
  private context: AudioContext;
  private source: AudioBufferSourceNode | null;
  private filter: BiquadFilterNode;
  private gain: GainNode;
  private audioFile: File;

  setFilterType(type: BiquadFilterType) {
    this.filter.type = type;
  }

  getAudioFile(): File {
    return this.audioFile;
  }

  constructor(audioFile: File) {
    this.context = new AudioContext();
    this.source = null;

    this.filter = this.context.createBiquadFilter();
    this.gain = this.context.createGain();
    this.audioFile = audioFile;

    // Configure the filter
    this.filter.type = 'bandpass';
    this.filter.frequency.value = 1000; // Center frequency (in Hz)
    this.filter.Q.value = 1; // Quality factor

    // Connect everything
    this.filter.connect(this.gain);
    this.gain.connect(this.context.destination);
  }

  setFrequency(frequency: number) {
    this.filter.frequency.value = frequency;
  }

  setGain(gain: number) {
    this.gain.gain.value = gain;
  }

  play() {
    // Load the audio file into the source
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (!event.target?.result) return;
    
      this.context.decodeAudioData(event.target.result as ArrayBuffer)
        .then(buffer => {
          this.source = this.context.createBufferSource();
          this.source.buffer = buffer;
          this.source.connect(this.filter);
          this.source.start();
        })
        .catch(error => console.error('Error decoding audio data', error));
    };

    reader.readAsArrayBuffer(this.audioFile);
  }

  stop() {
    if (this.source) {
      this.source.stop();
      this.source = null;
    } else {
      console.error('No source to stop');
    }
  }

}


export default function Home() {
  const [equalizer, setEqualizer] = useState<SimpleEqualizer | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  

  useEffect(() => {
    if (equalizer) {
      // Cast the WaveSurfer instance to any to suppress type checking
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current as HTMLDivElement | string,
        waveColor: 'violet',
        progressColor: 'purple',
        backend: 'MediaElement'
      }) as any;  // Cast to any
  
      wavesurfer.loadBlob(equalizer.getAudioFile());
  
      wavesurfer.on('ready', function () {
        console.log('wavesurfer is ready');
        console.log(wavesurfer);
        if ((wavesurfer as any).backend) { // No TypeScript error
          console.log('wavesurfer.backend is defined');
          console.log((wavesurfer as any).backend);
          if (typeof (wavesurfer as any).backend.getPeaks === 'function') {
            console.log('wavesurfer.backend.getPeaks is a function');
          } else {
            console.error('wavesurfer.backend.getPeaks is not a function');
          }
        } else {
          console.error('wavesurfer.backend is undefined');
        }
        try {
          const waveform = (wavesurfer as any).backend.getPeaks(255);

      
          // Create an array to store the vertices
          const vertices = [];
        
          for (let i = 0; i < waveform.length; i++) {
            const value = waveform[i];
            // Instead of pushing to geometry.vertices, push to the vertices array
            vertices.push(i, value * 50, 0);
          }
            // Create a Float32Array from the vertices array
          const verticesArray = new Float32Array(vertices);

          // Create a BufferAttribute with the verticesArray
          const bufferAttribute = new THREE.BufferAttribute(verticesArray, 3);

          // Create a BufferGeometry
          const geometry = new THREE.BufferGeometry();

          // Add the BufferAttribute to the BufferGeometry
          geometry.setAttribute('position', bufferAttribute);
    
          const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
          const line = new THREE.Line(geometry, material);
    
          // Create a scene, camera, and renderer
          const scene = new THREE.Scene();
          const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
          camera.position.z = 5;
    
          const renderer = new THREE.WebGLRenderer();
          renderer.setSize(window.innerWidth, window.innerHeight);
          document.body.appendChild(renderer.domElement);
    
          // Add the line to the scene
          scene.add(line);
    
          // Render the scene
          const animate = function () {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
          };
    
          animate();
        } catch (error) {
          console.error('Error getting peaks:', error);
        }

      });
    }
  }, [equalizer]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setEqualizer(new SimpleEqualizer(file));
    }
  };

  const handleFilterTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (equalizer) {
      equalizer.setFilterType(event.target.value as BiquadFilterType);
    }
  };

  const handlePlay = () => {
    if (equalizer) {
      equalizer.play();
    }
  };

  const handleStop = () => {
    if (equalizer) {
      equalizer.stop();
    }
  };

  const handleFrequencyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (equalizer) {
      equalizer.setFrequency(parseFloat(event.target.value));
    }
  };
  
  const handleGainChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (equalizer) {
      equalizer.setGain(parseFloat(event.target.value));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-5 space-y-4">
      <div className="text-2xl font-bold">SHITMAP PRE ALPHA </div>
      <input type="file" onChange={handleFileChange} className="mb-4" />
      <div className="flex justify-between space-x-4">
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handlePlay}
        >
          Play
        </button>
        <button 
          className="bg-red-500 text-white px-4 py-2 rounded"
          onClick={handleStop}
        >
          Stop
        </button>   
      </div>

      <div className="space-y-2">
        <label className="block">Filter Type:</label>
        <select onChange={handleFilterTypeChange} className="w-full p-2">
          <option value="lowpass">Lowpass</option>
          <option value="highpass">Highpass</option>
          <option value="bandpass">Bandpass</option>
          <option value="lowshelf">Lowshelf</option>
          <option value="highshelf">Highshelf</option>
          <option value="peaking">Peaking</option>
          <option value="notch">Notch</option>
          <option value="allpass">Allpass</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block">Frequency:</label>
        <input type="range" min="20" max="20000" step="1" onChange={handleFrequencyChange} className="w-full" />
      </div>

      <div className="space-y-2">
        <label className="block">Gain:</label>
        <input type="range" min="0" max="1" step="0.01" onChange={handleGainChange} className="w-full" />
      </div>
      
      <div ref={waveformRef} />


    </div>
  );

}

