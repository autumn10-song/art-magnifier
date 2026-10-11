// 돋보기 위치·배경 계산 (화면 요소와 분리된 순수 함수라서 테스트하기 쉽습니다)
(function (root) {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * @param {object} p
   * @param {number} p.x        작품 위 초점의 x 좌표(px, 작품 왼쪽 위 기준)
   * @param {number} p.y        작품 위 초점의 y 좌표(px)
   * @param {number} p.width    화면에 보이는 작품 너비(px)
   * @param {number} p.height   화면에 보이는 작품 높이(px)
   * @param {number} p.size     돋보기 지름(px)
   * @param {number} p.zoom     확대 배율
   * @param {number} [p.liftY]  돋보기를 초점보다 위로 띄울 거리(px, 손가락에 가려지지 않게)
   */
  function computeLens(p) {
    const x = clamp(p.x, 0, p.width);
    const y = clamp(p.y, 0, p.height);
    const half = p.size / 2;
    const liftY = p.liftY || 0;
    return {
      focusX: x,
      focusY: y,
      left: x - half,
      top: y - half - liftY,
      backgroundWidth: p.width * p.zoom,
      backgroundHeight: p.height * p.zoom,
      backgroundX: half - x * p.zoom,
      backgroundY: half - y * p.zoom,
    };
  }

  const api = { clamp, computeLens };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Lens = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
