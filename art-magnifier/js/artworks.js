// 기본으로 들어 있는 작품 목록입니다.
// 모두 저작권이 끝난(퍼블릭 도메인) 작품이며, 위키미디어 공용(commons.wikimedia.org)에서 불러옵니다.
// 작품을 더 넣고 싶다면 아래 형식대로 항목을 추가하거나, 화면의 [작품 추가] 버튼을 사용하세요.
(function (root) {
  function commons(fileName, width) {
    return (
      'https://commons.wikimedia.org/wiki/Special:FilePath/' +
      encodeURIComponent(fileName) +
      '?width=' + width
    );
  }

  function artwork(id, fileName, info) {
    return Object.assign(
      {
        id: id,
        src: commons(fileName, 2400),
        thumb: commons(fileName, 320),
        builtIn: true,
      },
      info
    );
  }

  root.DEFAULT_ARTWORKS = [
    artwork('starry-night', 'Van Gogh - Starry Night - Google Art Project.jpg', {
      title: '별이 빛나는 밤',
      artist: '빈센트 반 고흐',
      year: '1889',
      questions: [
        '하늘의 붓 자국은 어떤 방향으로 움직이고 있나요?',
        '별과 달 주위에는 어떤 색들이 섞여 있나요?',
        '마을의 집과 교회를 찾아보세요. 불이 켜진 창문은 몇 개인가요?',
      ],
    }),
    artwork('sunflowers', 'Vincent Willem van Gogh 127.jpg', {
      title: '해바라기',
      artist: '빈센트 반 고흐',
      year: '1888',
      questions: [
        '노란색에도 여러 가지가 있어요. 몇 가지 노란색을 찾을 수 있나요?',
        '물감이 두껍게 올라간 곳을 찾아보세요. 어떤 느낌이 드나요?',
        '활짝 핀 꽃과 시든 꽃은 어떻게 다르게 그렸나요?',
      ],
    }),
    artwork('grande-jatte', 'A Sunday on La Grande Jatte, Georges Seurat, 1884.jpg', {
      title: '그랑드 자트 섬의 일요일 오후',
      artist: '조르주 쇠라',
      year: '1884–1886',
      questions: [
        '가까이 확대해 보세요. 그림이 무엇으로 이루어져 있나요?',
        '초록색 잔디 속에 숨어 있는 다른 색의 점을 찾아보세요.',
        '동물은 모두 몇 마리 있나요? 원숭이를 찾을 수 있나요?',
      ],
    }),
    artwork('impression-sunrise', 'Monet - Impression, Sunrise.jpg', {
      title: '인상, 해돋이',
      artist: '클로드 모네',
      year: '1872',
      questions: [
        '해는 어디에 있나요? 해의 색과 주변 하늘의 색을 비교해 보세요.',
        '물 위에 비친 빛은 어떤 붓질로 표현했나요?',
        '배에 탄 사람을 찾아보세요. 자세히 그렸나요, 간단히 그렸나요?',
      ],
    }),
    artwork('great-wave', 'Tsunami by hokusai 19th century.jpg', {
      title: '가나가와 앞바다의 큰 파도',
      artist: '가쓰시카 호쿠사이',
      year: '1831년경',
      questions: [
        '파도 끝부분은 어떤 모양인가요? 무엇을 닮았나요?',
        '파도 사이에 숨은 산을 찾아보세요.',
        '배에 탄 사람들은 어떤 자세를 하고 있나요?',
      ],
    }),
    artwork('pearl-earring', '1665 Girl with a Pearl Earring.jpg', {
      title: '진주 귀걸이를 한 소녀',
      artist: '요하네스 페르메이르',
      year: '1665년경',
      questions: [
        '진주 귀걸이를 확대해 보세요. 빛은 어떻게 표현되어 있나요?',
        '눈동자와 입술에서 반짝이는 부분을 찾아보세요.',
        '머리에 두른 천은 어떤 색들로 이루어져 있나요?',
      ],
    }),
    artwork('tower-of-babel', 'Pieter Bruegel the Elder - The Tower of Babel (Vienna) - Google Art Project - edited.jpg', {
      title: '바벨탑',
      artist: '피터르 브뤼헐',
      year: '1563',
      questions: [
        '탑 위에서 일하는 사람들을 찾아보세요. 무엇을 하고 있나요?',
        '탑을 짓는 데 쓰이는 기계나 도구를 찾아보세요.',
        '왼쪽 아래에 있는 사람들은 누구일까요? 무엇을 하고 있나요?',
      ],
    }),
    artwork('the-kiss', 'The Kiss - Gustav Klimt - Google Cultural Institute.jpg', {
      title: '키스',
      artist: '구스타프 클림트',
      year: '1907–1908',
      questions: [
        '옷에 그려진 무늬를 확대해 보세요. 어떤 모양들이 있나요?',
        '남자와 여자의 옷 무늬는 어떻게 다른가요?',
        '발밑의 꽃밭에는 어떤 색의 꽃들이 있나요?',
      ],
    }),
    artwork('vertumnus', 'Arcimboldo Vertumnus.jpg', {
      title: '베르툼누스',
      artist: '주세페 아르침볼도',
      year: '1591년경',
      questions: [
        '얼굴은 무엇으로 만들어져 있나요? 과일과 채소의 이름을 말해 보세요.',
        '코, 눈, 볼은 각각 어떤 과일이나 채소인가요?',
        '나만의 얼굴을 만든다면 어떤 재료를 쓰고 싶나요?',
      ],
    }),
  ];

  // 모든 작품에 함께 보여 주는 관찰 질문
  root.COMMON_QUESTIONS = [
    '🎨 색: 가장 많이 쓰인 색과 가장 눈에 띄는 색은 무엇인가요?',
    '〰️ 선: 곧은 선, 굽은 선, 굵은 선, 가는 선을 찾아보세요.',
    '🔷 모양: 반복되는 모양이나 무늬가 있나요?',
    '✋ 질감: 만져 본다면 어떤 느낌일까요? 붓 자국이 보이나요?',
    '🕵️ 숨은 것: 멀리서는 안 보이고 가까이에서만 보이는 것을 찾아보세요.',
  ];
})(window);
