// 하단 이미지 관련 함수
let currentBottomMediaIndex = 0; // 현재 표시 중인 미디어 인덱스 (0부터 시작)
let bottomMediaTimer = null; // 자동 전환용 타이머
let isBottomMediaPlaying = true; // 하단 미디어 재생 상태
let bottomMediaFiles = []; // 정렬된 미디어 파일 목록을 저장할 배열

// 초기화: DOM이 로드되면 하단 미디어 표시 시작
document.addEventListener('DOMContentLoaded', function() {
  console.log("하단 미디어 스크립트 초기화");
  
  // 하단 미디어 파일 목록 초기화
  initBottomMediaFiles().then(() => {
    console.log("하단 미디어 파일 목록 초기화 완료:", bottomMediaFiles);
    
    // 하단 이미지/동영상 숨김 상태로 초기화
    hideBottomImage();
    
    // 정지 버튼 클릭 시 하단 미디어 정지
    document.getElementById('stopBtn').addEventListener('click', function() {
      stopBottomMediaShow();
    });
    
    // 일시 정지 버튼 클릭 시 하단 미디어 일시 정지/재개
    document.getElementById('pauseBtn').addEventListener('click', function() {
      toggleBottomMediaPause();
    });
    
    // 디버그용: 게임 캔버스 더블클릭 시 다음 미디어로 이동
    document.getElementById('gameCanvas').addEventListener('dblclick', function() {
      if (isBottomMediaPlaying) {
        moveToNextMedia();
      }
    });
  });
});

// 하단 미디어 파일 목록 초기화 (번호 순으로 정렬)
async function initBottomMediaFiles() {
  console.log("하단 미디어 파일 목록 가져오기 시작");
  bottomMediaFiles = [];
  
  // 파일 번호 1부터 시작해서 연속된 번호의 이미지/비디오 파일 확인
  let fileNumber = 1;
  let continueChecking = true;
  
  while (continueChecking) {
    // 이미지 파일(.jpg) 확인
    let imageExists = await checkFileExists(`images/bottom/${fileNumber}.jpg`);
    if (imageExists) {
      bottomMediaFiles.push({
        number: fileNumber,
        type: 'image',
        path: `images/bottom/${fileNumber}.jpg`
      });
      fileNumber++;
      continue;
    }
    
    // 비디오 파일(.mp4) 확인
    let videoExists = await checkFileExists(`images/bottom/${fileNumber}.mp4`);
    if (videoExists) {
      bottomMediaFiles.push({
        number: fileNumber,
        type: 'video',
        path: `images/bottom/${fileNumber}.mp4`
      });
      fileNumber++;
      continue;
    }
    
    // 더 이상 연속된 번호의 파일이 없으면 종료
    continueChecking = false;
  }
  
  // 번호 순으로 정렬
  bottomMediaFiles.sort((a, b) => a.number - b.number);
  
  console.log(`하단 미디어 파일 ${bottomMediaFiles.length}개 발견:`, bottomMediaFiles.map(file => file.path));
  return bottomMediaFiles;
}

// 미디어 목록 새로고침 (파일 추가/제거 확인)
async function refreshMediaFiles() {
  const oldCount = bottomMediaFiles.length;
  await initBottomMediaFiles();
  
  if (bottomMediaFiles.length !== oldCount) {
    console.log(`미디어 파일 목록 변경 감지: ${oldCount} -> ${bottomMediaFiles.length}`);
  }
  
  // 현재 인덱스가 범위를 벗어나면 처음으로 돌아감
  if (currentBottomMediaIndex >= bottomMediaFiles.length) {
    currentBottomMediaIndex = 0;
  }
}

// 하단 미디어 자동 표시 시작
function startBottomMediaShow() {
  console.log("하단 미디어 표시 시작 함수 호출");
  
  // 미디어 파일 목록 갱신
  refreshMediaFiles().then(() => {
    // 재생 중이 아닐 때만 시작
    isBottomMediaPlaying = true;
    
    // 이미 실행 중인 타이머가 있다면 제거
    if (bottomMediaTimer) {
      clearInterval(bottomMediaTimer);
      bottomMediaTimer = null;
    }
    
    // 하단 미디어 컨테이너 즉시 표시 준비
    const bottomImageContainer = document.getElementById('bottomImageContainer');
    if (bottomImageContainer) {
      bottomImageContainer.style.display = 'block';
      
      // 이전 애니메이션 완료 타이머 취소
      if (window.bottomHideTimer) {
        clearTimeout(window.bottomHideTimer);
      }
    }
    
    // 미디어 파일이 있는지 확인
    if (bottomMediaFiles.length > 0) {
      // 인덱스 초기화 (항상 첫 번째부터 시작)
      currentBottomMediaIndex = 0;
      
      // 즉시 현재 미디어 표시 시작
      showCurrentBottomMedia();
      
      // 이미지의 경우 10초마다, 비디오의 경우 비디오 종료 후 자동으로 다음으로 넘어감
      // 이미지일 경우를 위한 타이머 설정
      startImageTimer();
    } else {
      console.log("표시할 하단 미디어 파일이 없습니다.");
    }
  });
}

// 현재 보여지는 미디어가 이미지인 경우 타이머 시작
function startImageTimer() {
  // 기존 타이머 정리
  if (bottomMediaTimer) {
    clearTimeout(bottomMediaTimer);
    bottomMediaTimer = null;
  }
  
  // 현재 미디어가 이미지인 경우에만 타이머 설정
  if (bottomMediaFiles[currentBottomMediaIndex] && 
      bottomMediaFiles[currentBottomMediaIndex].type === 'image') {
    bottomMediaTimer = setTimeout(() => {
      if (isBottomMediaPlaying) {
        moveToNextMedia();
      }
    }, 10000); // 이미지는 10초 동안 표시
  }
}

// 추가된 함수: 현재 미디어를 4초 동안 서서히 숨기는 함수
function hideCurrentBottomMedia(callback) {
  const bottomImageContainer = document.getElementById('bottomImageContainer');
  const bottomImage = document.getElementById('bottomImage');
  const bottomVideo = document.getElementById('bottomVideo');

  if (bottomImageContainer) {
    // 4초 동안 아래로 내려가는 애니메이션 실행
    bottomImageContainer.style.bottom = '-150vh';

    // 이미지/비디오가 서서히 사라지도록 처리
    if (bottomImage) {
      bottomImage.classList.remove('show');
    }
    if (bottomVideo) {
      bottomVideo.style.opacity = '0';
    }

    // 4초(애니메이션 시간) 후 콜백 실행
    setTimeout(() => {
      if (callback) {
        callback();
      }
    }, 4000);
  } else {
    // 컨테이너가 없으면 즉시 콜백
    if (callback) {
      callback();
    }
  }
}

// --- JS 기반 애니메이션으로 변경 ---

// Easing 함수 (ease-out 효과)
function easeOutCubic(t) {
  return (--t) * t * t + 1;
}

// 애니메이션을 처리하는 범용 함수
function animate(options) {
  const start = performance.now();
  
  requestAnimationFrame(function animateFrame(time) {
    let timeFraction = (time - start) / options.duration;
    if (timeFraction > 1) timeFraction = 1;
    
    const progress = options.easing(timeFraction);
    options.draw(progress);
    
    if (timeFraction < 1) {
      requestAnimationFrame(animateFrame);
    } else if (options.callback) {
      options.callback();
    }
  });
}

// 올라오는 애니메이션
function slideUp(element, media, callback) {
  const container = element;
  const targetMedia = media;
  // 미디어 높이 계산
  let mediaHeight = 0;
  if (targetMedia && targetMedia.offsetHeight) {
    mediaHeight = targetMedia.offsetHeight;
  } else {
    mediaHeight = window.innerHeight / 3;
  }
  const startPos = -mediaHeight; // 화면 아래에서 시작
  const endPos = -80; // 화면 하단에서 80px 위까지만 올라옴
  
  animate({
    duration: 4000, // 올라오는 속도 4초
    easing: easeOutCubic,
    draw(progress) {
      container.style.bottom = `${startPos + (endPos - startPos) * progress}px`;
      targetMedia.style.opacity = progress;
    },
    callback: callback
  });
}

// 내려가는 애니메이션
function slideDown(element, media, callback) {
  const container = element;
  const targetMedia = media;
  let mediaHeight = 0;
  if (targetMedia && targetMedia.offsetHeight) {
    mediaHeight = targetMedia.offsetHeight;
  } else {
    mediaHeight = window.innerHeight / 3;
  }
  const startPos = -80; // 올라온 자리에서 바로 내려감
  const endPos = -mediaHeight; // 화면 아래로 완전히 사라짐
  
  animate({
    duration: 4000, // 내려가는 속도 4초
    easing: easeOutCubic,
    draw(progress) {
      container.style.bottom = `${startPos + (endPos - startPos) * progress}px`;
      targetMedia.style.opacity = 1 - progress;
    },
    callback: callback
  });
}

// 다음 미디어로 이동
function moveToNextMedia() {
  // 타이머 정리
  if (bottomMediaTimer) {
    clearTimeout(bottomMediaTimer);
    bottomMediaTimer = null;
  }

  const bottomImageContainer = document.getElementById('bottomImageContainer');
  const currentMediaElement = document.getElementById('bottomVideo') || document.getElementById('bottomImage');
  
  // 현재 미디어를 4초간 숨긴 후 다음 미디어를 표시
  slideDown(bottomImageContainer, currentMediaElement, () => {
    if (!isBottomMediaPlaying) return; // 숨기는 중에 중지될 수 있음

    // 다음 인덱스로 이동
    currentBottomMediaIndex++;
    
    // 마지막 미디어 이후에는 다시 처음으로 돌아감
    if (currentBottomMediaIndex >= bottomMediaFiles.length) {
      currentBottomMediaIndex = 0;
    }
    
    console.log(`다음 미디어로 이동: ${currentBottomMediaIndex} (${bottomMediaFiles.length}개 중)`);
    showCurrentBottomMedia(); // 내려가는 애니메이션이 끝난 후 바로 다음 미디어를 올림
  });
}

// 하단 미디어 정지
function stopBottomMediaShow() {
  console.log("하단 미디어 정지");
  isBottomMediaPlaying = false;
  
  // 타이머 제거
  if (bottomMediaTimer) {
    clearTimeout(bottomMediaTimer);
    bottomMediaTimer = null;
  }
  
  // 미디어 숨김
  hideBottomImage();
  
  // 인덱스 초기화
  currentBottomMediaIndex = 0;
}

// 하단 미디어 일시 정지/재개 토글
function toggleBottomMediaPause() {
  isBottomMediaPlaying = !isBottomMediaPlaying;
  console.log("하단 미디어 상태 변경:", isBottomMediaPlaying ? "재생" : "일시정지");
  
  // 현재 비디오가 표시 중이면 재생/일시 정지 토글
  const bottomVideo = document.getElementById('bottomVideo');
  if (bottomVideo && bottomVideo.style.display !== 'none') {
    if (isBottomMediaPlaying) {
      bottomVideo.play().catch(e => console.log('하단 비디오 재생 오류:', e));
    } else {
      bottomVideo.pause();
    }
  }
  
  // 재생 상태가 되면 타이머 다시 시작 (이미지일 경우)
  if (isBottomMediaPlaying) {
    startImageTimer();
  } else {
    // 일시정지면 타이머 중지
    if (bottomMediaTimer) {
      clearTimeout(bottomMediaTimer);
      bottomMediaTimer = null;
    }
  }
}

// 현재 인덱스의 미디어 표시
function showCurrentBottomMedia() {
  if (!isBottomMediaPlaying || bottomMediaFiles.length === 0) return;
  
  // 미디어 파일 정보 가져오기
  const mediaFile = bottomMediaFiles[currentBottomMediaIndex];
  if (!mediaFile) {
    console.error("현재 인덱스에 해당하는 미디어 파일이 없습니다:", currentBottomMediaIndex);
    return;
  }
  
  console.log(`미디어 표시 (${currentBottomMediaIndex + 1}/${bottomMediaFiles.length}): ${mediaFile.type} - ${mediaFile.path}`);
  
  // 타입에 따라 다른 함수 호출
  if (mediaFile.type === 'image') {
    showBottomImageContent(mediaFile.number);
    // 이미지는 자동 타이머 설정
    startImageTimer();
  } else if (mediaFile.type === 'video') {
    showBottomVideoContent(mediaFile.number);
    // 비디오는 onended 이벤트에서 다음으로 넘어가므로 여기서는 타이머 설정 안 함
  }
}

// 하단 미디어 숨김
function hideBottomImage() {
  const bottomImageContainer = document.getElementById('bottomImageContainer');
  const bottomImage = document.getElementById('bottomImage');
  const bottomVideo = document.getElementById('bottomVideo');
  
  if (bottomImageContainer) {
    // 이미지 애니메이션 클래스 제거
    if (bottomImage) {
      bottomImage.classList.remove('show');
    }
    
    // 비디오 애니메이션 효과 제거
    if (bottomVideo) {
      bottomVideo.style.opacity = '0';
      bottomVideo.pause();
    }
    
    // 컨테이너를 아래로 슬라이드하여 숨김
    bottomImageContainer.style.bottom = '-150vh';
    
    // 애니메이션 완료 후 컨테이너 숨기기
    if (window.bottomHideTimer) {
      clearTimeout(window.bottomHideTimer);
    }
    window.bottomHideTimer = setTimeout(() => {
      bottomImageContainer.style.display = 'none';
    }, 4000); // 4초 후 완전히 숨김
  }
}

// 이 함수는 이제 사용하지 않음 (showCurrentBottomMedia로 대체)
function showBottomMedia(index) {
  console.log("경고: 이전 버전의 showBottomMedia 함수가 호출됨. 대신 showCurrentBottomMedia를 사용하세요.");
  
  // 파일 목록 새로고침 후 현재 미디어 표시
  refreshMediaFiles().then(() => {
    // 특정 번호의 파일을 찾아 인덱스 설정
    const fileIndex = bottomMediaFiles.findIndex(file => file.number === index);
    
    if (fileIndex !== -1) {
      currentBottomMediaIndex = fileIndex;
    } else {
      console.log(`미디어 번호 ${index}를 찾을 수 없어 처음부터 시작합니다.`);
      currentBottomMediaIndex = 0;
    }
    
    showCurrentBottomMedia();
  });
}

// 파일 존재 여부 확인 (Head 요청으로 확인)
function checkFileExists(url) {
  return fetch(url, { method: 'HEAD' })
    .then(response => response.ok)
    .catch(() => false);
}

// 하단 이미지 콘텐츠 표시
function showBottomImageContent(index) {
  const bottomImageContainer = document.getElementById('bottomImageContainer');
  const bottomImage = document.getElementById('bottomImage');
  
  if (!bottomImage || !bottomImageContainer) return;
  
  // 다른 미디어 숨김
  if (document.getElementById('bottomVideo')) {
    document.getElementById('bottomVideo').style.display = 'none';
  }
  bottomImage.style.display = 'block';
  bottomImage.src = `images/bottom/${index}.jpg`;
  
  bottomImage.onload = function() {
    bottomImageContainer.style.display = 'block';
    bottomImage.style.opacity = '0'; // 시작 투명도
    // 첫번째, 두번째 미디어만 5px 위로
    if (currentBottomMediaIndex === 0 || currentBottomMediaIndex === 1) {
      bottomImageContainer.style.bottom = '-85px';
    } else {
      bottomImageContainer.style.bottom = '-80px';
    }
    slideUp(bottomImageContainer, bottomImage);
  };
  
  bottomImage.onerror = function() {
    console.log(`하단 이미지 ${index}.jpg를 찾을 수 없습니다.`);
    bottomImageContainer.style.display = 'none';
  };
}

// 하단 동영상 콘텐츠 표시
function showBottomVideoContent(index) {
  const bottomImageContainer = document.getElementById('bottomImageContainer');
  let bottomVideo = document.getElementById('bottomVideo');
  
  // 비디오 요소 생성 (기존 코드와 유사)
  if (!bottomVideo) {
    bottomVideo = document.createElement('video');
    bottomVideo.id = 'bottomVideo';
    bottomVideo.className = 'no-border-at-all video-touchable';
    bottomVideo.controls = true; 
    bottomVideo.autoplay = false;
    bottomVideo.muted = false;
    bottomVideo.playsInline = true;
    bottomImageContainer.appendChild(bottomVideo);
  }
  
  // 다른 미디어 숨김
  if (document.getElementById('bottomImage')) {
    document.getElementById('bottomImage').style.display = 'none';
  }
  bottomVideo.style.display = 'block';
  bottomVideo.src = `images/bottom/${index}.mp4`;
  
  bottomVideo.onloadeddata = function() {
    bottomImageContainer.style.display = 'block';
    bottomVideo.style.opacity = '0'; // 시작 투명도
    // 첫번째, 두번째 미디어만 5px 위로
    if (currentBottomMediaIndex === 0 || currentBottomMediaIndex === 1) {
      bottomImageContainer.style.bottom = '-85px';
    } else {
      bottomImageContainer.style.bottom = '-80px';
    }
    slideUp(bottomImageContainer, bottomVideo, () => {
        if (isBottomMediaPlaying) {
            bottomVideo.play().catch(e => console.error("Video play failed", e));
        }
    });
  };

  bottomVideo.onerror = function() {
    console.log(`하단 동영상 ${index}.mp4를 찾을 수 없습니다.`);
    bottomImageContainer.style.display = 'none';
  };
  
  bottomVideo.onended = function() {
    if (isBottomMediaPlaying) {
      moveToNextMedia();
    }
  };
}

// 모든 하단 미디어 요소 초기화
function resetBottomMediaElements() {
  const bottomImage = document.getElementById('bottomImage');
  const bottomVideo = document.getElementById('bottomVideo');
  const bottomImageContainer = document.getElementById('bottomImageContainer');
  
  if (bottomImage) {
    bottomImage.classList.remove('show');
    bottomImage.src = '';
  }
  
  if (bottomVideo) {
    bottomVideo.style.opacity = '0';
    bottomVideo.pause();
    bottomVideo.src = '';
  }
  
  // 컨테이너 위치 초기화 (화면 밖으로)
  if (bottomImageContainer) {
    // 이전 타이머 정리
    if (window.bottomHideTimer) {
      clearTimeout(window.bottomHideTimer);
    }
    
    // 컨테이너 초기화하고 표시 상태로 준비
    bottomImageContainer.style.bottom = '-150vh'; // 화면 밖 위치로 초기화
    bottomImageContainer.style.display = 'block'; // 표시 상태로 유지
  }
}
