const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardsMatchFailed',
  CardsMatched: 'CardsMatched',
  GameFinished: 'GameFinished'
}

// 此處 Symbols 常數儲存的資料不會變動，因此習慣上將首字母大寫以表示此特性。
const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]


const view = {
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `     
      <p>${number}</p>
      <img src="${symbol}" alt="">
      <p>${number}</p> `
  },
  getCardElement(index) {
    return `<div data-index = "${index}"class="card back"></div>`
  },

  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
      //default:不符合的case，執行這個條件裡的語句

    }
  },

  // 找到容器後把HTML塞進去
  // const view ={
  //    displayCards : function displayCards(){  }...}可以省略成以下
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },

  // ...把傳進來的陣列變成一個個值，也可以把值蒐集起來變成陣列
  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        //回傳正面
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      // 回傳背面
      card.classList.add('back')
      card.innerHTML = null
    })

  },

  // 配對成功的樣式變化(配對成功時先將classList加上paired)
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },

  renderScore(score) {
    document.querySelector('.score').textContent = `Score: ${score}`
  },

  renderTriedTimes(times) {
    document.querySelector('.tried').textContent = `You've tried: ${times} times`
  },

  appendWrongAnimation(...cards) {
    cards.map(card =>{
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong')),
      {
        once: true
      }
    })    
  },

  // 遊戲結束
  showGameFinished(){
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML=`
    <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)

  }

}



const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

// 資料管理，目前翻開來的牌是哪兩張
const model = {
  //  revealedCards代表「被翻開的卡片」，每次翻牌時，就先把卡片丟進這個牌組，集滿兩張牌時就要檢查配對有沒有成功，檢查完以後，這個暫存牌組就需要清空
  revealedCards: [],

  // 看兩張牌數字是否一樣
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  score: 0,
  triedTimes: 0


}

// 狀態是定義在controller裡面，由controller去呼叫view和model
const controller = {
  // 定義遊戲起始狀態
  currentState: GAME_STATE.FirstCardAwaits,

  // game start的function
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  // 推進遊戲狀態(翻牌)，依照不同的遊戲狀態，做不同的行為
  dispatchCardAction(card) {
    //已經翻開的卡片再去點它是沒有用的，所以要先做檢查
    // 如果這張卡classList沒有'back'也就是被翻開了，就直接結束，這張牌沒有要做下一步
    if (!card.classList.contains('back')) {
      return
    }
    // 準備翻開第一張牌時要做的事：把牌翻開；存進revealedCards；把初始狀態更改為待翻開第二張牌的狀態
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes((++model.triedTimes))
        view.flipCards(card)
        model.revealedCards.push(card)

        // 判斷是否配對正確(console.log(model.isRevealedCardsMatched()會顯示true / false)
        if (model.isRevealedCardsMatched()) {
          //配對正確,翻開排且變底色，並清空儲存處
          view.renderScore((model.score += 10))
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          if(model.score === 260){
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits

        }
        else {
          // 配對失敗，停留一秒鐘(1000)，清空儲存處並翻回
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
          //resetCards雖然是function，如果此處寫成resetCards()會失敗，因為setTimeout的第一個參數要傳入的是function本身，加了()變成是呼叫完function的結果

        }
        break
    }
    console.log('currentState:', this.currentState)
    console.log('revealedCards:', model.revealedCards)
  },

  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
  // 此處寫controller.currentState好像在controller裡面呼叫controller，但是因為setTimeout呼叫了 (this.resetCards)，this的對象變成了setTimeout，所以不能用this.currentState

}

// 由controller去呼叫
controller.generateCards()

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    // view.showGameFinished()
    controller.dispatchCardAction(card)
  })
})