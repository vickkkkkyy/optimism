package testutils

import (
	"github.com/stretchr/testify/mock"

	"github.com/ethereum-optimism/optimism/op-node/rollup"
)

type MockEmitter struct {
	mock.Mock
}

func (m *MockEmitter) Emit(ev rollup.Event) {
	m.Mock.MethodCalled("Emit", ev)
}

func (m *MockEmitter) ExpectOnce(expected rollup.Event) {
	m.Mock.On("Emit", expected).Once()
}

func (m *MockEmitter) AssertExpectations(t mock.TestingT) {
	m.Mock.AssertExpectations(t)
}

var _ rollup.EventEmitter = (*MockEmitter)(nil)
